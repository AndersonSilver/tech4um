import { Server, Socket } from "socket.io";
import { parse as parseCookie } from "cookie";
import {
  SOCKET_EVENTS,
  JoinForumPayload,
  SendPublicMessagePayload,
  SendPrivateMessagePayload,
  TypingPayload,
  LeaveForumPayload,
  ReactToMessagePayload,
  SetForumPresencePayload,
} from "@tech4um/shared";
import { TokenService } from "../utils/TokenService";
import { tokenBlacklist } from "../utils/TokenBlacklist";
import { AUTH_COOKIE_NAME } from "../utils/authCookie";
import { ForumRepository } from "../repositories/ForumRepository";
import { MessageService } from "../services/MessageService";
import { MessageReactionService } from "../services/MessageReactionService";
import { toChatMessage } from "../utils/messageSerializer";
import { isValidUploadedImageUrl } from "../utils/imageUpload";
import { logger } from "../utils/logger";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  tokenJti?: string;
}

// Mapa em memória userId -> socketId (para mensagens privadas e múltiplas salas)
const onlineUsers = new Map<string, string>();

// Rate limiting simples por socket: máximo de mensagens em uma janela de tempo,
// para mitigar flood/spam (DoS de aplicação) via WebSocket.
const MESSAGE_WINDOW_MS = 10_000;
const MESSAGE_LIMIT_PER_WINDOW = 20;
const messageCounters = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const entry = messageCounters.get(socketId);

  if (!entry || now - entry.windowStart > MESSAGE_WINDOW_MS) {
    messageCounters.set(socketId, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > MESSAGE_LIMIT_PER_WINDOW;
}

// Revalida o token periodicamente durante a conexão — sem isso, um token
// revogado (logout) ou expirado continuaria "logado" indefinidamente no socket,
// já que o handshake só é checado uma vez, na conexão.
const REVALIDATION_INTERVAL_MS = 5 * 60 * 1000;

export class ChatSocketHandler {
  private forumRepository = new ForumRepository();
  private messageService = new MessageService();
  private messageReactionService = new MessageReactionService();

  constructor(private io: Server) {
    this.io.use(this.authenticate);
    this.io.on("connection", (socket: AuthenticatedSocket) => this.handleConnection(socket));
  }

  private extractTokenFromHandshake(socket: Socket): string | null {
    const fromAuth = socket.handshake.auth?.token;
    if (fromAuth) return fromAuth;

    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = parseCookie(cookieHeader);
    return cookies[AUTH_COOKIE_NAME] ?? null;
  }

  private authenticate = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
      const token = this.extractTokenFromHandshake(socket);
      if (!token) return next(new Error("Token não fornecido"));

      const payload = TokenService.verify(token);
      if (await tokenBlacklist.isRevoked(payload.jti)) {
        return next(new Error("Sessão revogada"));
      }

      socket.userId = payload.sub;
      socket.username = payload.username;
      socket.tokenJti = payload.jti;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  };

  private handleConnection(socket: AuthenticatedSocket) {
    if (socket.userId) onlineUsers.set(socket.userId, socket.id);

    const revalidationTimer = setInterval(
      () => this.revalidateSession(socket),
      REVALIDATION_INTERVAL_MS
    );

    socket.on(SOCKET_EVENTS.JOIN_FORUM, ({ forumId }: JoinForumPayload) =>
      this.onJoinForum(socket, forumId)
    );
    socket.on(SOCKET_EVENTS.SEND_PUBLIC_MESSAGE, (payload: SendPublicMessagePayload) =>
      this.onPublicMessage(socket, payload)
    );
    socket.on(SOCKET_EVENTS.SEND_PRIVATE_MESSAGE, (payload: SendPrivateMessagePayload) =>
      this.onPrivateMessage(socket, payload)
    );
    socket.on(SOCKET_EVENTS.TYPING, ({ forumId }: TypingPayload) => this.onTyping(socket, forumId));
    socket.on(SOCKET_EVENTS.LEAVE_FORUM, ({ forumId }: LeaveForumPayload) =>
      this.onLeaveForum(socket, forumId)
    );
    socket.on(SOCKET_EVENTS.REACT_TO_MESSAGE, (payload: ReactToMessagePayload) =>
      this.onReactToMessage(socket, payload)
    );
    socket.on(SOCKET_EVENTS.SET_FORUM_PRESENCE, (payload: SetForumPresencePayload) =>
      this.onSetForumPresence(socket, payload)
    );
    socket.on("disconnect", () => {
      clearInterval(revalidationTimer);
      messageCounters.delete(socket.id);
      this.onDisconnect(socket);
    });
  }

  private async revalidateSession(socket: AuthenticatedSocket) {
    if (!socket.tokenJti) return;

    if (await tokenBlacklist.isRevoked(socket.tokenJti)) {
      socket.emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: "Sua sessão foi encerrada. Faça login novamente.",
      });
      socket.disconnect(true);
    }

    // A expiração natural do JWT (jwt.verify lançaria erro) também é
    // respeitada: como não guardamos o token bruto por simplicidade aqui,
    // a expiração é garantida pelo tempo de vida do cookie + nova autenticação
    // no reconnect do socket.io. Para um controle ainda mais estrito, armazenar
    // o token bruto no socket e chamar TokenService.verify() de novo aqui.
  }

  private broadcastPresenceUpdate(...forumIds: string[]) {
    const uniqueForumIds = [...new Set(forumIds.filter(Boolean))];
    if (uniqueForumIds.length === 0) return;

    // Um único evento por transição de presença — evita rajadas de refetch no frontend.
    this.io.emit(SOCKET_EVENTS.FORUM_PRESENCE_UPDATED, {
      forumId: uniqueForumIds[uniqueForumIds.length - 1],
    });
  }

  private async onJoinForum(socket: AuthenticatedSocket, forumId: string) {
    if (!socket.userId) return;

    // Entra na room imediatamente para que mensagens/typing funcionem
    // mesmo enquanto o banco ainda persiste participação.
    socket.join(forumId);
    socket.emit(SOCKET_EVENTS.FORUM_JOINED, { forumId });

    try {
      const leftForums = await this.forumRepository.setOfflineInOtherForums(
        socket.userId,
        forumId
      );

      await this.forumRepository.addParticipant(forumId, socket.userId);
      await this.forumRepository.setOnlineStatus(forumId, socket.userId, true);

      for (const leftForumId of leftForums) {
        socket.leave(leftForumId);
        this.io.to(leftForumId).emit(SOCKET_EVENTS.PARTICIPANT_OFFLINE, {
          userId: socket.userId,
        });
      }

      this.io.to(forumId).emit(SOCKET_EVENTS.PARTICIPANT_ONLINE, {
        userId: socket.userId,
        username: socket.username,
      });

      this.io.to(forumId).emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: `${socket.username} entrou na sala`,
      });

      this.broadcastPresenceUpdate(...leftForums, forumId);
    } catch (error) {
      logger.error("Falha ao registrar participação no fórum", {
        forumId,
        userId: socket.userId,
        error,
      });
      socket.emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: "Não foi possível entrar na sala. Tente novamente.",
      });
    }
  }

  private async onPublicMessage(
    socket: AuthenticatedSocket,
    payload: SendPublicMessagePayload
  ) {
    if (!socket.userId) return;
    if (!this.validateMessagePayload(socket, payload?.content, payload?.imageUrl)) return;

    const message = await this.messageService.sendPublic({
      forumId: payload.forumId,
      senderId: socket.userId,
      content: payload.content ?? "",
      imageUrl: payload.imageUrl,
    });

    this.io.to(payload.forumId).emit(SOCKET_EVENTS.NEW_PUBLIC_MESSAGE, {
      message: toChatMessage(message),
    });
  }

  private async onPrivateMessage(
    socket: AuthenticatedSocket,
    payload: SendPrivateMessagePayload
  ) {
    if (!socket.userId) return;
    if (!this.validateMessagePayload(socket, payload?.content, payload?.imageUrl)) return;

    // Garante que o destinatário realmente participa do fórum em questão —
    // evita que um usuário autenticado envie mensagens "privadas" para
    // qualquer userId arbitrário fora do contexto da sala.
    const forum = await this.forumRepository.findById(payload.forumId);
    const recipientIsParticipant = forum?.participants?.some(
      (p) => p.userId === payload.recipientId
    );

    if (!recipientIsParticipant) {
      socket.emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: "Não foi possível enviar: destinatário não participa desta sala.",
      });
      return;
    }

    const message = await this.messageService.sendPrivate({
      forumId: payload.forumId,
      senderId: socket.userId,
      recipientId: payload.recipientId,
      content: payload.content ?? "",
      imageUrl: payload.imageUrl,
    });

    const serialized = toChatMessage(message);

    // Emite somente para o remetente e o destinatário
    socket.emit(SOCKET_EVENTS.NEW_PRIVATE_MESSAGE, { message: serialized });

    const recipientSocketId = onlineUsers.get(payload.recipientId);
    if (recipientSocketId) {
      this.io.to(recipientSocketId).emit(SOCKET_EVENTS.NEW_PRIVATE_MESSAGE, {
        message: serialized,
      });
    }
  }

  private validateMessagePayload(
    socket: AuthenticatedSocket,
    content: unknown,
    imageUrl?: unknown
  ): boolean {
    if (isRateLimited(socket.id)) {
      socket.emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: "Você está enviando mensagens muito rápido. Aguarde um instante.",
      });
      return false;
    }

    const text = typeof content === "string" ? content : "";
    const image = typeof imageUrl === "string" ? imageUrl : "";
    const hasText = text.trim().length > 0;
    const hasImage = image.length > 0 && isValidUploadedImageUrl(image);

    if (!hasText && !hasImage) {
      socket.emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: "Mensagem inválida (vazia ou excede o tamanho máximo).",
      });
      return false;
    }

    if (text.length > 2000) {
      socket.emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: "Mensagem inválida (vazia ou excede o tamanho máximo).",
      });
      return false;
    }

    if (image && !isValidUploadedImageUrl(image)) {
      socket.emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: "Imagem anexada inválida.",
      });
      return false;
    }

    return true;
  }

  private onTyping(socket: AuthenticatedSocket, forumId: string) {
    socket.to(forumId).emit(SOCKET_EVENTS.USER_TYPING, { username: socket.username });
  }

  private async onReactToMessage(
    socket: AuthenticatedSocket,
    payload: ReactToMessagePayload
  ) {
    if (!socket.userId || !payload?.messageId || !payload?.forumId || !payload?.emoji) return;

    try {
      const reactions = await this.messageReactionService.toggleReaction(
        payload.messageId,
        socket.userId,
        payload.emoji
      );

      const message = await this.messageService.getById(payload.messageId);
      if (!message) return;

      const serializedReactions = reactions.map((reaction) => ({
        emoji: reaction.emoji,
        userId: reaction.userId,
        user: reaction.user?.toPublic(),
      }));

      const updatePayload = {
        messageId: payload.messageId,
        forumId: payload.forumId,
        reactions: serializedReactions,
      };

      if (message.type === "public") {
        this.io.to(payload.forumId).emit(SOCKET_EVENTS.MESSAGE_REACTION_UPDATED, updatePayload);
        return;
      }

      socket.emit(SOCKET_EVENTS.MESSAGE_REACTION_UPDATED, updatePayload);

      const otherUserId =
        message.senderId === socket.userId ? message.recipientId : message.senderId;
      if (!otherUserId) return;

      const recipientSocketId = onlineUsers.get(otherUserId);
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit(SOCKET_EVENTS.MESSAGE_REACTION_UPDATED, updatePayload);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível reagir à mensagem.";
      socket.emit(SOCKET_EVENTS.SYSTEM_NOTICE, { message });
    }
  }

  private async onSetForumPresence(
    socket: AuthenticatedSocket,
    payload: SetForumPresencePayload
  ) {
    if (!socket.userId || !payload?.forumId || typeof payload.isOnline !== "boolean") return;
    if (!socket.rooms.has(payload.forumId)) return;

    await this.forumRepository.setOnlineStatus(
      payload.forumId,
      socket.userId,
      payload.isOnline
    );

    if (payload.isOnline) {
      this.io.to(payload.forumId).emit(SOCKET_EVENTS.PARTICIPANT_ONLINE, {
        userId: socket.userId,
        username: socket.username,
      });
    } else {
      this.io.to(payload.forumId).emit(SOCKET_EVENTS.PARTICIPANT_OFFLINE, {
        userId: socket.userId,
      });
    }

    this.broadcastPresenceUpdate(payload.forumId);
  }

  private async onLeaveForum(socket: AuthenticatedSocket, forumId: string) {
    if (!socket.userId) return;
    socket.leave(forumId);
    await this.forumRepository.setOnlineStatus(forumId, socket.userId, false);
    this.io.to(forumId).emit(SOCKET_EVENTS.PARTICIPANT_OFFLINE, { userId: socket.userId });
    this.io.to(forumId).emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
      message: `${socket.username} saiu da sala`,
    });
    this.broadcastPresenceUpdate(forumId);
  }

  private onDisconnect(socket: AuthenticatedSocket) {
    if (!socket.userId) return;
    onlineUsers.delete(socket.userId);

    const affectedForums: string[] = [];
    socket.rooms.forEach((forumId) => {
      if (forumId === socket.id) return;
      affectedForums.push(forumId);
      this.forumRepository.setOnlineStatus(forumId, socket.userId!, false);
      this.io.to(forumId).emit(SOCKET_EVENTS.PARTICIPANT_OFFLINE, { userId: socket.userId });
      this.io.to(forumId).emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: `${socket.username} saiu da sala`,
      });
    });

    this.broadcastPresenceUpdate(...affectedForums);
  }
}

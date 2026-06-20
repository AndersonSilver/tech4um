import { Server, Socket } from "socket.io";
import {
  SOCKET_EVENTS,
  JoinForumPayload,
  SendPublicMessagePayload,
  SendPrivateMessagePayload,
  TypingPayload,
  LeaveForumPayload,
} from "@tech4um/shared";
import { TokenService } from "../utils/TokenService";
import { ForumRepository } from "../repositories/ForumRepository";
import { MessageService } from "../services/MessageService";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

// Mapa em memória userId -> socketId (para mensagens privadas e múltiplas salas)
const onlineUsers = new Map<string, string>();

export class ChatSocketHandler {
  private forumRepository = new ForumRepository();
  private messageService = new MessageService();

  constructor(private io: Server) {
    this.io.use(this.authenticate);
    this.io.on("connection", (socket: AuthenticatedSocket) => this.handleConnection(socket));
  }

  private authenticate = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Token não fornecido"));

      const payload = TokenService.verify(token);
      socket.userId = payload.sub;
      socket.username = payload.username;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  };

  private handleConnection(socket: AuthenticatedSocket) {
    if (socket.userId) onlineUsers.set(socket.userId, socket.id);

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
    socket.on("disconnect", () => this.onDisconnect(socket));
  }

  private async onJoinForum(socket: AuthenticatedSocket, forumId: string) {
    if (!socket.userId) return;

    await this.forumRepository.addParticipant(forumId, socket.userId);
    await this.forumRepository.setOnlineStatus(forumId, socket.userId, true);

    socket.join(forumId);

    this.io.to(forumId).emit(SOCKET_EVENTS.PARTICIPANT_ONLINE, {
      userId: socket.userId,
      username: socket.username,
    });

    this.io.to(forumId).emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
      message: `${socket.username} entrou na sala`,
    });

    socket.emit(SOCKET_EVENTS.FORUM_JOINED, { forumId });
  }

  private async onPublicMessage(
    socket: AuthenticatedSocket,
    payload: SendPublicMessagePayload
  ) {
    if (!socket.userId) return;

    const message = await this.messageService.sendPublic({
      forumId: payload.forumId,
      senderId: socket.userId,
      content: payload.content,
    });

    this.io.to(payload.forumId).emit(SOCKET_EVENTS.NEW_PUBLIC_MESSAGE, { message });
  }

  private async onPrivateMessage(
    socket: AuthenticatedSocket,
    payload: SendPrivateMessagePayload
  ) {
    if (!socket.userId) return;

    const message = await this.messageService.sendPrivate({
      forumId: payload.forumId,
      senderId: socket.userId,
      recipientId: payload.recipientId,
      content: payload.content,
    });

    // Emite somente para o remetente e o destinatário
    socket.emit(SOCKET_EVENTS.NEW_PRIVATE_MESSAGE, { message });

    const recipientSocketId = onlineUsers.get(payload.recipientId);
    if (recipientSocketId) {
      this.io.to(recipientSocketId).emit(SOCKET_EVENTS.NEW_PRIVATE_MESSAGE, { message });
    }
  }

  private onTyping(socket: AuthenticatedSocket, forumId: string) {
    socket.to(forumId).emit(SOCKET_EVENTS.USER_TYPING, { username: socket.username });
  }

  private async onLeaveForum(socket: AuthenticatedSocket, forumId: string) {
    if (!socket.userId) return;
    socket.leave(forumId);
    await this.forumRepository.setOnlineStatus(forumId, socket.userId, false);
    this.io.to(forumId).emit(SOCKET_EVENTS.PARTICIPANT_OFFLINE, { userId: socket.userId });
    this.io.to(forumId).emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
      message: `${socket.username} saiu da sala`,
    });
  }

  private onDisconnect(socket: AuthenticatedSocket) {
    if (!socket.userId) return;
    onlineUsers.delete(socket.userId);

    socket.rooms.forEach((forumId) => {
      if (forumId === socket.id) return;
      this.forumRepository.setOnlineStatus(forumId, socket.userId!, false);
      this.io.to(forumId).emit(SOCKET_EVENTS.PARTICIPANT_OFFLINE, { userId: socket.userId });
      this.io.to(forumId).emit(SOCKET_EVENTS.SYSTEM_NOTICE, {
        message: `${socket.username} saiu da sala`,
      });
    });
  }
}

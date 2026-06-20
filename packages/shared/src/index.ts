// Tipos de domínio compartilhados entre @tech4um/backend e @tech4um/frontend.
// Mantém o contrato de dados (entidades, DTOs e eventos de socket) em um único lugar,
// evitando duplicação e divergência entre as duas pontas da aplicação.

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface Forum {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  owner?: PublicUser;
  createdAt: string;
  participants?: ForumParticipant[];
}

export interface ForumParticipant {
  id: string;
  userId: string;
  isOnline: boolean;
  user: PublicUser;
}

export type MessageType = "public" | "private";

export interface ChatMessage {
  id: string;
  content: string;
  type: MessageType;
  senderId: string;
  recipientId?: string;
  forumId: string;
  createdAt: string;
  sender?: PublicUser;
  recipient?: PublicUser;
}

// ---------- DTOs de requisição (REST) ----------

export interface RegisterRequestDTO {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface GoogleLoginRequestDTO {
  idToken: string;
}

export interface CreateForumRequestDTO {
  name: string;
  description?: string;
}

export interface AuthResponseDTO {
  user: PublicUser;
  token: string;
}

// ---------- Eventos de WebSocket (client -> server) ----------

export interface JoinForumPayload {
  forumId: string;
}

export interface SendPublicMessagePayload {
  forumId: string;
  content: string;
}

export interface SendPrivateMessagePayload {
  forumId: string;
  recipientId: string;
  content: string;
}

export interface TypingPayload {
  forumId: string;
}

export interface LeaveForumPayload {
  forumId: string;
}

// ---------- Eventos de WebSocket (server -> client) ----------

export interface ForumJoinedPayload {
  forumId: string;
}

export interface NewMessagePayload {
  message: ChatMessage;
}

export interface ParticipantStatusPayload {
  userId: string;
  username?: string;
}

export interface UserTypingPayload {
  username: string;
}

export interface SystemNoticePayload {
  message: string;
}

export const SOCKET_EVENTS = {
  // client -> server
  JOIN_FORUM: "join_forum",
  SEND_PUBLIC_MESSAGE: "send_public_message",
  SEND_PRIVATE_MESSAGE: "send_private_message",
  TYPING: "typing",
  LEAVE_FORUM: "leave_forum",
  // server -> client
  FORUM_JOINED: "forum_joined",
  NEW_PUBLIC_MESSAGE: "new_public_message",
  NEW_PRIVATE_MESSAGE: "new_private_message",
  PARTICIPANT_ONLINE: "participant_online",
  PARTICIPANT_OFFLINE: "participant_offline",
  USER_TYPING: "user_typing",
  SYSTEM_NOTICE: "system_notice",
} as const;

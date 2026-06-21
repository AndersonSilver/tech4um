// Tipos de domínio compartilhados entre @tech4um/backend e @tech4um/frontend.
// Mantém o contrato de dados (entidades, DTOs e eventos de socket) em um único lugar,
// evitando duplicação e divergência entre as duas pontas da aplicação.

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
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
  imageUrl?: string;
  sender?: PublicUser;
  recipient?: PublicUser;
  reactions?: ChatMessageReaction[];
}

export interface ChatMessageReaction {
  emoji: string;
  userId: string;
  user?: PublicUser;
}

export const QUICK_REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;

export type QuickReactionEmoji = (typeof QUICK_REACTION_EMOJIS)[number];

// ---------- DTOs de requisição (REST) ----------

export interface RegisterRequestDTO {
  username: string;
  email: string;
  password: string;
  captchaToken: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
  captchaToken: string;
}

export interface GoogleLoginRequestDTO {
  code: string;
  redirectUri: string;
}

export interface CreateForumRequestDTO {
  name: string;
  description?: string;
}

export interface AuthResponseDTO {
  user: PublicUser;
  token: string;
}

// Resposta de login quando MFA está habilitado: nenhuma sessão é criada ainda,
// o client precisa completar o segundo fator em /auth/mfa/verify.
export interface MfaRequiredResponseDTO {
  mfaRequired: true;
  mfaToken: string;
}

export type LoginResponseDTO = AuthResponseDTO | MfaRequiredResponseDTO;

export interface VerifyMfaRequestDTO {
  mfaToken: string;
  code: string;
}

export interface MfaSetupResponseDTO {
  qrCodeDataUrl: string;
  secret: string;
}

export interface EnableMfaRequestDTO {
  code: string;
}

export interface DisableMfaRequestDTO {
  code: string;
}

export interface PresetAvatar {
  id: string;
  label: string;
  path: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: "blue-bot", label: "Robô azul", path: "/api/avatars/blue-bot.svg" },
  { id: "orange-fox", label: "Raposa", path: "/api/avatars/orange-fox.svg" },
  { id: "green-frog", label: "Sapo", path: "/api/avatars/green-frog.svg" },
  { id: "purple-owl", label: "Coruja", path: "/api/avatars/purple-owl.svg" },
  { id: "pink-bunny", label: "Coelho", path: "/api/avatars/pink-bunny.svg" },
  { id: "yellow-bee", label: "Abelha", path: "/api/avatars/yellow-bee.svg" },
  { id: "red-panda", label: "Panda", path: "/api/avatars/red-panda.svg" },
  { id: "teal-cat", label: "Gato", path: "/api/avatars/teal-cat.svg" },
];

export const PRESET_AVATAR_IDS = PRESET_AVATARS.map((avatar) => avatar.id) as [
  string,
  ...string[],
];

export interface UpdateAvatarRequestDTO {
  dataUrl?: string;
  presetId?: string;
}

export interface UpdateAvatarResponseDTO {
  user: PublicUser;
}

export interface ResendVerificationRequestDTO {
  email: string;
}

export interface VerifyEmailRequestDTO {
  token: string;
}

// ---------- Eventos de WebSocket (client -> server) ----------

export interface JoinForumPayload {
  forumId: string;
}

export interface SendPublicMessagePayload {
  forumId: string;
  content: string;
  imageUrl?: string;
}

export interface SendPrivateMessagePayload {
  forumId: string;
  recipientId: string;
  content: string;
  imageUrl?: string;
}

export interface TypingPayload {
  forumId: string;
}

export interface LeaveForumPayload {
  forumId: string;
}

export interface ReactToMessagePayload {
  forumId: string;
  messageId: string;
  emoji: string;
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

export interface MessageReactionUpdatedPayload {
  messageId: string;
  forumId: string;
  reactions: ChatMessageReaction[];
}

export interface ForumPresenceUpdatedPayload {
  forumId: string;
}

export const SOCKET_EVENTS = {
  // client -> server
  JOIN_FORUM: "join_forum",
  SEND_PUBLIC_MESSAGE: "send_public_message",
  SEND_PRIVATE_MESSAGE: "send_private_message",
  TYPING: "typing",
  LEAVE_FORUM: "leave_forum",
  REACT_TO_MESSAGE: "react_to_message",
  // server -> client
  FORUM_JOINED: "forum_joined",
  NEW_PUBLIC_MESSAGE: "new_public_message",
  NEW_PRIVATE_MESSAGE: "new_private_message",
  PARTICIPANT_ONLINE: "participant_online",
  PARTICIPANT_OFFLINE: "participant_offline",
  USER_TYPING: "user_typing",
  SYSTEM_NOTICE: "system_notice",
  MESSAGE_REACTION_UPDATED: "message_reaction_updated",
  FORUM_PRESENCE_UPDATED: "forum_presence_updated",
} as const;

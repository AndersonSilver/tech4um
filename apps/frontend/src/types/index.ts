// Os tipos de domínio agora vêm de @tech4um/shared (fonte única de verdade,
// compartilhada com o backend). Mantemos os aliases abaixo para não precisar
// reescrever todos os componentes que já usavam o nome `User`.
export type {
  PublicUser as User,
  Forum,
  ForumParticipant,
  MessageType,
  ChatMessage as Message,
} from "@tech4um/shared";

import { MessageReactionService } from "../services/MessageReactionService";
import { MessageReactionRepository } from "../repositories/MessageReactionRepository";
import { MessageRepository } from "../repositories/MessageRepository";
import { Message, MessageType } from "../entities/Message";
import { MessageReaction } from "../entities/MessageReaction";

function buildMessage(overrides: Partial<Message> = {}): Message {
  const message = new Message();
  message.id = "msg-1";
  message.content = "Teste";
  message.type = MessageType.PUBLIC;
  message.senderId = "user-1";
  message.forumId = "forum-1";
  Object.assign(message, overrides);
  return message;
}

describe("MessageReactionService", () => {
  function buildService(
    messageRepoOverrides: Partial<MessageRepository> = {},
    reactionRepoOverrides: Partial<MessageReactionRepository> = {}
  ) {
    const messageRepository = {
      findById: jest.fn(),
      ...messageRepoOverrides,
    } as unknown as MessageRepository;

    const reactionRepository = {
      findByMessageAndUser: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(),
      create: jest.fn(),
      findByMessage: jest.fn().mockResolvedValue([]),
      ...reactionRepoOverrides,
    } as unknown as MessageReactionRepository;

    return {
      service: new MessageReactionService(reactionRepository, messageRepository),
      messageRepository,
      reactionRepository,
    };
  }

  it("rejeita emoji fora da lista permitida", async () => {
    const { service } = buildService();

    await expect(service.toggleReaction("msg-1", "user-2", "🚀")).rejects.toThrow(
      "Emoji de reação inválido"
    );
  });

  it("cria reação quando ainda não existe", async () => {
    const message = buildMessage();
    const { service, reactionRepository } = buildService(
      { findById: jest.fn().mockResolvedValue(message) },
      { findByMessageAndUser: jest.fn().mockResolvedValue(null) }
    );

    await service.toggleReaction("msg-1", "user-2", "👍");

    expect(reactionRepository.create).toHaveBeenCalledWith({
      messageId: "msg-1",
      userId: "user-2",
      emoji: "👍",
    });
  });

  it("remove reação quando o mesmo emoji é enviado de novo", async () => {
    const message = buildMessage();
    const existing = new MessageReaction();
    existing.id = "reaction-1";
    existing.messageId = "msg-1";
    existing.userId = "user-2";
    existing.emoji = "❤️";

    const { service, reactionRepository } = buildService(
      { findById: jest.fn().mockResolvedValue(message) },
      { findByMessageAndUser: jest.fn().mockResolvedValue(existing) }
    );

    await service.toggleReaction("msg-1", "user-2", "❤️");

    expect(reactionRepository.remove).toHaveBeenCalledWith(existing);
  });

  it("bloqueia reação em mensagem privada invisível", async () => {
    const privateMessage = buildMessage({
      type: MessageType.PRIVATE,
      senderId: "user-1",
      recipientId: "user-3",
    });

    const { service } = buildService({
      findById: jest.fn().mockResolvedValue(privateMessage),
    });

    await expect(service.toggleReaction("msg-1", "user-2", "👍")).rejects.toThrow(
      "Mensagem não visível para este usuário"
    );
  });

  it("atualiza emoji quando o usuário troca a reação existente", async () => {
    const message = buildMessage();
    const existing = new MessageReaction();
    existing.id = "reaction-1";
    existing.messageId = "msg-1";
    existing.userId = "user-2";
    existing.emoji = "👍";

    const { service, reactionRepository } = buildService(
      { findById: jest.fn().mockResolvedValue(message) },
      {
        findByMessageAndUser: jest.fn().mockResolvedValue(existing),
        save: jest.fn().mockResolvedValue(undefined),
        findByMessage: jest.fn().mockResolvedValue([]),
      }
    );

    await service.toggleReaction("msg-1", "user-2", "❤️");

    expect(existing.emoji).toBe("❤️");
    expect(reactionRepository.save).toHaveBeenCalledWith(existing);
    expect(reactionRepository.remove).not.toHaveBeenCalled();
  });

  it("isAllowedEmoji() valida emojis da lista rápida", () => {
    const { service } = buildService();
    expect(service.isAllowedEmoji("👍")).toBe(true);
    expect(service.isAllowedEmoji("🚀")).toBe(false);
  });
});

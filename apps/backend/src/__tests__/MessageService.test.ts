import { MessageService } from "../services/MessageService";
import { MessageRepository } from "../repositories/MessageRepository";
import { Message, MessageType } from "../entities/Message";

function buildMessage(overrides: Partial<Message> = {}): Message {
  const message = new Message();
  message.id = "msg-1";
  message.content = "Olá!";
  message.type = MessageType.PUBLIC;
  message.senderId = "user-1";
  message.forumId = "forum-1";
  Object.assign(message, overrides);
  return message;
}

describe("MessageService", () => {
  function buildService(overrides: Partial<MessageRepository> = {}) {
    const repository = {
      create: jest.fn(),
      findByForum: jest.fn(),
      findById: jest.fn(),
      ...overrides,
    } as unknown as MessageRepository;

    return { service: new MessageService(repository), repository };
  }

  it("sendPublic() persiste mensagem pública", async () => {
    const saved = buildMessage();
    const { service, repository } = buildService({
      create: jest.fn().mockResolvedValue(saved),
    });

    const result = await service.sendPublic({
      forumId: "forum-1",
      senderId: "user-1",
      content: "Olá!",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: MessageType.PUBLIC, content: "Olá!" })
    );
    expect(result.id).toBe("msg-1");
  });

  it("sendPrivate() persiste mensagem privada com destinatário", async () => {
    const saved = buildMessage({ type: MessageType.PRIVATE, recipientId: "user-2" });
    const { service, repository } = buildService({
      create: jest.fn().mockResolvedValue(saved),
    });

    await service.sendPrivate({
      forumId: "forum-1",
      senderId: "user-1",
      recipientId: "user-2",
      content: "Privada",
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: MessageType.PRIVATE,
        recipientId: "user-2",
      })
    );
  });

  it("listVisibleForUser() filtra mensagens privadas de terceiros", async () => {
    const publicMessage = buildMessage({ id: "msg-public" });
    const privateForUser = buildMessage({
      id: "msg-private-visible",
      type: MessageType.PRIVATE,
      recipientId: "user-2",
    });
    const privateHidden = buildMessage({
      id: "msg-private-hidden",
      type: MessageType.PRIVATE,
      senderId: "user-3",
      recipientId: "user-4",
    });

    const { service } = buildService({
      findByForum: jest.fn().mockResolvedValue([publicMessage, privateForUser, privateHidden]),
    });

    const visible = await service.listVisibleForUser("forum-1", "user-2");

    expect(visible.map((message) => message.id)).toEqual(["msg-public", "msg-private-visible"]);
  });

  it("getById() delega busca ao repositório", async () => {
    const message = buildMessage();
    const { service, repository } = buildService({
      findById: jest.fn().mockResolvedValue(message),
    });

    const result = await service.getById("msg-1");

    expect(repository.findById).toHaveBeenCalledWith("msg-1");
    expect(result).toBe(message);
  });
});

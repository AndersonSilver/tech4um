import { MessageController } from "../controllers/MessageController";
import { MessageService } from "../services/MessageService";
import { Message, MessageType } from "../entities/Message";
import { User } from "../entities/User";

function buildMessage(overrides: Partial<Message> = {}): Message {
  const sender = new User();
  sender.id = "user-1";
  sender.username = "lara";
  sender.email = "lara@email.com";

  const message = new Message();
  message.id = "msg-1";
  message.content = "Olá!";
  message.type = MessageType.PUBLIC;
  message.senderId = "user-1";
  message.forumId = "forum-1";
  message.createdAt = new Date("2026-06-20T12:00:00.000Z");
  message.sender = sender;
  Object.assign(message, overrides);
  return message;
}

function buildResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("MessageController", () => {
  it("listByForum() retorna mensagens serializadas visíveis ao usuário", async () => {
    const message = buildMessage();
    const messageService = {
      listVisibleForUser: jest.fn().mockResolvedValue([message]),
    } as unknown as MessageService;

    const controller = new MessageController(messageService);
    const req = { params: { id: "forum-1" }, userId: "user-1" } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.listByForum(req, res as any, next);

    expect(messageService.listVisibleForUser).toHaveBeenCalledWith("forum-1", "user-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "msg-1",
        content: "Olá!",
        type: MessageType.PUBLIC,
        senderId: "user-1",
        createdAt: "2026-06-20T12:00:00.000Z",
        reactions: [],
      }),
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("listByForum() repassa erro do serviço para o middleware", async () => {
    const error = new Error("Falha ao listar");
    const messageService = {
      listVisibleForUser: jest.fn().mockRejectedValue(error),
    } as unknown as MessageService;

    const controller = new MessageController(messageService);
    const req = { params: { id: "forum-1" }, userId: "user-1" } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.listByForum(req, res as any, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });
});

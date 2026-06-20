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

describe("Message.isVisibleTo", () => {
  it("mensagem pública é visível para qualquer usuário", () => {
    const message = buildMessage({ type: MessageType.PUBLIC });
    expect(message.isVisibleTo("qualquer-usuario")).toBe(true);
  });

  it("mensagem privada é visível para o remetente", () => {
    const message = buildMessage({
      type: MessageType.PRIVATE,
      senderId: "user-1",
      recipientId: "user-2",
    });
    expect(message.isVisibleTo("user-1")).toBe(true);
  });

  it("mensagem privada é visível para o destinatário", () => {
    const message = buildMessage({
      type: MessageType.PRIVATE,
      senderId: "user-1",
      recipientId: "user-2",
    });
    expect(message.isVisibleTo("user-2")).toBe(true);
  });

  it("mensagem privada NÃO é visível para terceiros", () => {
    const message = buildMessage({
      type: MessageType.PRIVATE,
      senderId: "user-1",
      recipientId: "user-2",
    });
    expect(message.isVisibleTo("user-3")).toBe(false);
  });
});

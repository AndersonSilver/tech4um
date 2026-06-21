import { toChatMessage } from "../utils/messageSerializer";
import { Message, MessageType } from "../entities/Message";
import { MessageReaction } from "../entities/MessageReaction";
import { User } from "../entities/User";

describe("messageSerializer", () => {
  it("toChatMessage() serializa mensagem com remetente e reações", () => {
    const sender = new User();
    sender.id = "user-1";
    sender.username = "lara";
    sender.email = "lara@email.com";

    const reaction = new MessageReaction();
    reaction.emoji = "👍";
    reaction.userId = "user-2";
    reaction.user = sender;

    const message = new Message();
    message.id = "msg-1";
    message.content = "Teste";
    message.type = MessageType.PUBLIC;
    message.senderId = "user-1";
    message.forumId = "forum-1";
    message.createdAt = new Date("2026-06-20T10:00:00.000Z");
    message.sender = sender;
    message.reactions = [reaction];

    const result = toChatMessage(message);

    expect(result).toEqual({
      id: "msg-1",
      content: "Teste",
      type: MessageType.PUBLIC,
      senderId: "user-1",
      recipientId: undefined,
      forumId: "forum-1",
      createdAt: "2026-06-20T10:00:00.000Z",
      imageUrl: undefined,
      sender: sender.toPublic(),
      recipient: undefined,
      reactions: [
        {
          emoji: "👍",
          userId: "user-2",
          user: sender.toPublic(),
        },
      ],
    });
  });
});

import { Forum } from "../entities/Forum";
import { ForumParticipant } from "../entities/ForumParticipant";
import { MessageReaction } from "../entities/MessageReaction";

describe("Forum entities", () => {
  it("Forum armazena metadados básicos", () => {
    const forum = new Forum();
    forum.id = "forum-1";
    forum.name = "Cloud";
    forum.ownerId = "user-1";

    expect(forum.name).toBe("Cloud");
    expect(forum.ownerId).toBe("user-1");
  });

  it("ForumParticipant relaciona usuário e fórum", () => {
    const participant = new ForumParticipant();
    participant.id = "part-1";
    participant.forumId = "forum-1";
    participant.userId = "user-1";
    participant.isOnline = true;

    expect(participant.isOnline).toBe(true);
  });

  it("MessageReaction guarda emoji por usuário e mensagem", () => {
    const reaction = new MessageReaction();
    reaction.messageId = "msg-1";
    reaction.userId = "user-1";
    reaction.emoji = "❤️";

    expect(reaction.emoji).toBe("❤️");
  });
});

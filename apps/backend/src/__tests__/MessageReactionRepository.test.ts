import { MessageReactionRepository } from "../repositories/MessageReactionRepository";
import { AppDataSource } from "../config/data-source";
import { MessageReaction } from "../entities/MessageReaction";

jest.mock("../config/data-source", () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

describe("MessageReactionRepository", () => {
  let repoMock: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    repoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve({ id: "react-1", ...entity })),
      remove: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);
  });

  it("findByMessageAndUser busca reação única", async () => {
    const repository = new MessageReactionRepository();
    await repository.findByMessageAndUser("msg-1", "user-1");

    expect(repoMock.findOne).toHaveBeenCalledWith({
      where: { messageId: "msg-1", userId: "user-1" },
    });
  });

  it("create salva nova reação", async () => {
    const repository = new MessageReactionRepository();
    const reaction = await repository.create({ messageId: "m1", userId: "u1", emoji: "👍" });

    expect(repoMock.save).toHaveBeenCalled();
    expect(reaction.emoji).toBe("👍");
  });

  it("remove exclui reação", async () => {
    const reaction = new MessageReaction();
    reaction.id = "react-1";

    const repository = new MessageReactionRepository();
    await repository.remove(reaction);

    expect(repoMock.remove).toHaveBeenCalledWith(reaction);
  });
});

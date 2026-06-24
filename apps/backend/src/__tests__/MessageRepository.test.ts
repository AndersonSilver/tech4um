import { MessageRepository } from "../repositories/MessageRepository";
import { AppDataSource } from "../config/data-source";

jest.mock("../config/data-source", () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

describe("MessageRepository", () => {
  let repoMock: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(() => {
    repoMock = {
      create: jest.fn((data) => ({ id: "msg-new", ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);
  });

  it("create persiste e recarrega com relações", async () => {
    const loaded = { id: "msg-new", content: "oi", sender: { id: "u1" } };
    repoMock.findOne.mockResolvedValue(loaded);

    const repository = new MessageRepository();
    const message = await repository.create({
      content: "oi",
      forumId: "f1",
      senderId: "u1",
    });

    expect(repoMock.save).toHaveBeenCalled();
    expect(message).toEqual(loaded);
  });

  it("create lança erro se mensagem não for encontrada após save", async () => {
    repoMock.findOne.mockResolvedValue(null);

    const repository = new MessageRepository();
    await expect(repository.create({ content: "oi" })).rejects.toThrow(
      "Message not found after create"
    );
  });

  it("findByForum ordena por createdAt ASC com relações", async () => {
    repoMock.find.mockResolvedValue([]);

    const repository = new MessageRepository();
    await repository.findByForum("forum-1");

    expect(repoMock.find).toHaveBeenCalledWith({
      where: { forumId: "forum-1" },
      relations: ["sender", "recipient", "reactions", "reactions.user"],
      order: { createdAt: "ASC" },
    });
  });
});

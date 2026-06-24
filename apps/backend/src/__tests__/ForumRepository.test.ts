import { ForumRepository } from "../repositories/ForumRepository";
import { AppDataSource } from "../config/data-source";

jest.mock("../config/data-source", () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

describe("ForumRepository", () => {
  let forumRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let participantRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(() => {
    forumRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve({ id: "forum-1", ...entity })),
    };

    participantRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve({ id: "part-1", ...entity })),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: { name?: string }) => {
      if (entity.name === "ForumParticipant") return participantRepo;
      return forumRepo;
    });
  });

  it("addParticipant reutiliza participante existente", async () => {
    const existing = { id: "part-1", forumId: "f1", userId: "u1" };
    participantRepo.findOne.mockResolvedValue(existing);

    const repository = new ForumRepository();
    const result = await repository.addParticipant("f1", "u1");

    expect(result).toBe(existing);
    expect(participantRepo.save).not.toHaveBeenCalled();
  });

  it("addParticipant cria novo participante online", async () => {
    participantRepo.findOne.mockResolvedValue(null);

    const repository = new ForumRepository();
    await repository.addParticipant("f1", "u1");

    expect(participantRepo.create).toHaveBeenCalledWith({
      forumId: "f1",
      userId: "u1",
      isOnline: true,
    });
    expect(participantRepo.save).toHaveBeenCalled();
  });

  it("setOfflineInOtherForums retorna ids afetados", async () => {
    participantRepo.find.mockResolvedValue([
      { forumId: "f1", userId: "u1", isOnline: true },
      { forumId: "f2", userId: "u1", isOnline: true },
    ]);

    const execute = jest.fn().mockResolvedValue(undefined);
    const secondAndWhere = jest.fn().mockReturnValue({ execute });
    const firstAndWhere = jest.fn().mockReturnValue({ andWhere: secondAndWhere });
    const where = jest.fn().mockReturnValue({ andWhere: firstAndWhere });
    const set = jest.fn().mockReturnValue({ where });
    participantRepo.createQueryBuilder.mockReturnValue({ update: () => ({ set }) });

    const repository = new ForumRepository();
    const forumIds = await repository.setOfflineInOtherForums("u1", "f2");

    expect(forumIds).toEqual(["f1"]);
    expect(execute).toHaveBeenCalled();
  });

  it("setOfflineInOtherForums retorna vazio quando não há salas stale", async () => {
    participantRepo.find.mockResolvedValue([
      { forumId: "f2", userId: "u1", isOnline: true },
    ]);

    const repository = new ForumRepository();
    const forumIds = await repository.setOfflineInOtherForums("u1", "f2");

    expect(forumIds).toEqual([]);
    expect(participantRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});

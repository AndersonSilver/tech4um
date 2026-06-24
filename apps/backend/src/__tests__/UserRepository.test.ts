import { UserRepository } from "../repositories/UserRepository";
import { AppDataSource } from "../config/data-source";

jest.mock("../config/data-source", () => ({
  AppDataSource: { getRepository: jest.fn() },
}));

function buildRepoMock() {
  return {
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((entity) => Promise.resolve({ id: "user-1", ...entity })),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

describe("UserRepository", () => {
  let repoMock: ReturnType<typeof buildRepoMock>;

  beforeEach(() => {
    repoMock = buildRepoMock();
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(repoMock);
  });

  it("findByEmail consulta por email", async () => {
    const repository = new UserRepository();
    repoMock.findOne.mockResolvedValue({ email: "a@b.com" });

    const user = await repository.findByEmail("a@b.com");

    expect(repoMock.findOne).toHaveBeenCalledWith({ where: { email: "a@b.com" } });
    expect(user).toEqual({ email: "a@b.com" });
  });

  it("create salva novo usuário", async () => {
    const repository = new UserRepository();
    const created = await repository.create({ username: "lara", email: "lara@x.com" });

    expect(repoMock.create).toHaveBeenCalled();
    expect(repoMock.save).toHaveBeenCalled();
    expect(created.username).toBe("lara");
  });

  it("updateProfile atualiza e retorna usuário", async () => {
    const repository = new UserRepository();
    repoMock.findOneOrFail.mockResolvedValue({ id: "user-1", username: "novo" });

    const user = await repository.updateProfile("user-1", { username: "novo" });

    expect(repoMock.update).toHaveBeenCalledWith("user-1", { username: "novo" });
    expect(user.username).toBe("novo");
  });

});

import { ForumService } from "../services/ForumService";
import { ForumRepository } from "../repositories/ForumRepository";
import { Forum } from "../entities/Forum";
import { AppError } from "../utils/AppError";

function buildForum(overrides: Partial<Forum> = {}): Forum {
  const forum = new Forum();
  forum.id = "forum-1";
  forum.name = "Inteligência Artificial";
  forum.ownerId = "user-1";
  Object.assign(forum, overrides);
  return forum;
}

describe("ForumService", () => {
  function buildService(overrides: Partial<ForumRepository> = {}) {
    const repository = {
      findAll: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      addParticipant: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      ...overrides,
    } as unknown as ForumRepository;

    return { service: new ForumService(repository), repository };
  }

  it("create() rejeita nomes duplicados", async () => {
    const { service } = buildService({
      findByName: jest.fn().mockResolvedValue(buildForum()),
    });

    await expect(
      service.create({ name: "Inteligência Artificial", ownerId: "user-1" })
    ).rejects.toThrow(AppError);
  });

  it("create() adiciona o criador como participante", async () => {
    const created = buildForum();
    const populated = buildForum({ participants: [] });

    const { service, repository } = buildService({
      findByName: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(created),
      findById: jest.fn().mockResolvedValue(populated),
    });

    await service.create({ name: "Cloud Computing", ownerId: "user-1" });

    expect(repository.addParticipant).toHaveBeenCalledWith("forum-1", "user-1");
  });

  it("getById() retorna 404 quando o fórum não existe", async () => {
    const { service } = buildService({
      findById: jest.fn().mockResolvedValue(null),
    });

    await expect(service.getById("missing")).rejects.toThrow("Fórum não encontrado");
  });

  it("join() adiciona o usuário ao fórum existente", async () => {
    const forum = buildForum();
    const { service, repository } = buildService({
      findById: jest.fn().mockResolvedValue(forum),
    });

    await service.join("forum-1", "user-2");

    expect(repository.addParticipant).toHaveBeenCalledWith("forum-1", "user-2");
  });

  it("list() retorna todos os fóruns do repositório", async () => {
    const forums = [buildForum(), buildForum({ id: "forum-2", name: "Cloud" })];
    const { service, repository } = buildService({
      findAll: jest.fn().mockResolvedValue(forums),
    });

    const result = await service.list();

    expect(repository.findAll).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });
});

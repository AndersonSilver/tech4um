import { ForumController } from "../controllers/ForumController";
import { ForumService } from "../services/ForumService";
import { AppError } from "../utils/AppError";

function buildResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("ForumController", () => {
  it("create() retorna 201 com o fórum criado", async () => {
    const forum = { id: "forum-1", name: "DevOps e CI/CD" };
    const forumService = {
      create: jest.fn().mockResolvedValue(forum),
    } as unknown as ForumService;

    const controller = new ForumController(forumService);
    const req = {
      body: { name: "DevOps e CI/CD", description: "Pipelines" },
      userId: "user-1",
    } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.create(req, res as any, next);

    expect(forumService.create).toHaveBeenCalledWith({
      name: "DevOps e CI/CD",
      description: "Pipelines",
      ownerId: "user-1",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(forum);
    expect(next).not.toHaveBeenCalled();
  });

  it("create() repassa erro de validação para o middleware", async () => {
    const controller = new ForumController();
    const req = { body: { name: "ab" }, userId: "user-1" } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.create(req, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("getById() retorna 404 via next quando o serviço falha", async () => {
    const forumService = {
      getById: jest.fn().mockRejectedValue(new AppError("Fórum não encontrado", 404)),
    } as unknown as ForumService;

    const controller = new ForumController(forumService);
    const req = { params: { id: "missing" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.getById(req, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
  });

  it("list() retorna todos os fóruns", async () => {
    const forums = [{ id: "forum-1", name: "DevOps" }];
    const forumService = {
      list: jest.fn().mockResolvedValue(forums),
    } as unknown as ForumService;

    const controller = new ForumController(forumService);
    const res = buildResponse();
    const next = jest.fn();

    await controller.list({} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(forums);
  });

  it("join() adiciona usuário autenticado ao fórum", async () => {
    const forum = { id: "forum-1", name: "Cloud" };
    const forumService = {
      join: jest.fn().mockResolvedValue(forum),
    } as unknown as ForumService;

    const controller = new ForumController(forumService);
    const req = { params: { id: "forum-1" }, userId: "user-2" } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.join(req, res as any, next);

    expect(forumService.join).toHaveBeenCalledWith("forum-1", "user-2");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(forum);
  });
});

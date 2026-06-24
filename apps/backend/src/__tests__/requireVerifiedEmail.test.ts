import { Request, Response } from "express";
import { User } from "../entities/User";

const findById = jest.fn();

jest.mock("../repositories/UserRepository", () => ({
  UserRepository: jest.fn().mockImplementation(() => ({ findById })),
}));

describe("requireVerifiedEmail", () => {
  let requireVerifiedEmail: (
    req: Request,
    res: Response,
    next: jest.Mock
  ) => Promise<void>;
  let next: jest.Mock;

  beforeEach(async () => {
    jest.resetModules();
    findById.mockReset();
    next = jest.fn();
    ({ requireVerifiedEmail } = await import("../middlewares/requireVerifiedEmail"));
  });

  function buildUser(verified: boolean) {
    const user = new User();
    user.id = "user-1";
    user.isEmailVerified = verified;
    return user;
  }

  it("permite usuário com e-mail verificado", async () => {
    findById.mockResolvedValue(buildUser(true));
    const req = { userId: "user-1" } as unknown as Request;

    await requireVerifiedEmail(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("bloqueia usuário com e-mail pendente", async () => {
    findById.mockResolvedValue(buildUser(false));
    const req = { userId: "user-1" } as unknown as Request;

    await requireVerifiedEmail(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("confirmar seu e-mail"),
        statusCode: 403,
      })
    );
  });

  it("bloqueia quando usuário não existe", async () => {
    findById.mockResolvedValue(null);
    const req = { userId: "user-1" } as unknown as Request;

    await requireVerifiedEmail(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("confirmar seu e-mail"),
        statusCode: 403,
      })
    );
  });
});

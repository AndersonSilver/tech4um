import { AuthController } from "../controllers/AuthController";
import { AuthService } from "../services/AuthService";
import { CaptchaVerifier } from "../services/CaptchaVerifier";
import { resolveUserIdFromRequest } from "../middlewares/authMiddleware";
import { tokenBlacklist } from "../utils/TokenBlacklist";
import { setAuthCookie, clearAuthCookie } from "../utils/authCookie";
import { AppError } from "../utils/AppError";
import { User } from "../entities/User";

jest.mock("../services/CaptchaVerifier", () => ({
  CaptchaVerifier: { verify: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("../middlewares/authMiddleware", () => ({
  resolveUserIdFromRequest: jest.fn(),
}));

jest.mock("../utils/authCookie", () => ({
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
}));

jest.mock("../utils/TokenBlacklist", () => ({
  tokenBlacklist: { revoke: jest.fn().mockResolvedValue(undefined) },
}));

function buildUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = "user-1";
  user.username = "lara";
  user.email = "lara@email.com";
  Object.assign(user, overrides);
  return user;
}

function buildResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe("AuthController", () => {
  const captchaVerify = CaptchaVerifier.verify as jest.Mock;
  const resolveUserId = resolveUserIdFromRequest as jest.Mock;
  const revokeToken = tokenBlacklist.revoke as jest.Mock;

  function buildController(authOverrides: Partial<AuthService> = {}) {
    const authService = {
      register: jest.fn(),
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      getProfile: jest.fn(),
      updateAvatar: jest.fn(),
      ...authOverrides,
    } as unknown as AuthService;

    return {
      controller: new AuthController(authService),
      authService,
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    captchaVerify.mockResolvedValue(undefined);
  });

  it("register() retorna 201 e define cookie de sessão", async () => {
    const publicUser = buildUser().toPublic();
    const { controller, authService } = buildController({
      register: jest.fn().mockResolvedValue({ user: publicUser, token: "jwt-token" }),
    });

    const req = {
      body: {
        username: "lara",
        email: "lara@email.com",
        password: "Senha123",
        captchaToken: "captcha",
      },
      ip: "127.0.0.1",
    } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.register(req, res as any, next);

    expect(captchaVerify).toHaveBeenCalledWith("captcha", "127.0.0.1", "register");
    expect(authService.register).toHaveBeenCalled();
    expect(setAuthCookie).toHaveBeenCalledWith(res, "jwt-token");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: publicUser });
  });

  it("register() repassa erro de validação", async () => {
    const { controller } = buildController();
    const req = { body: { username: "ab" }, ip: "127.0.0.1" } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.register(req, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(setAuthCookie).not.toHaveBeenCalled();
  });

  it("login() retorna usuário e cookie de sessão", async () => {
    const publicUser = buildUser().toPublic();
    const { controller } = buildController({
      login: jest.fn().mockResolvedValue({ user: publicUser, token: "jwt-token" }),
    });

    const req = {
      body: { email: "lara@email.com", password: "Senha123", captchaToken: "captcha" },
      ip: "127.0.0.1",
    } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.login(req, res as any, next);

    expect(setAuthCookie).toHaveBeenCalledWith(res, "jwt-token");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: publicUser });
  });

  it("google() retorna usuário autenticado via OAuth", async () => {
    const publicUser = buildUser().toPublic();
    const { controller } = buildController({
      loginWithGoogle: jest.fn().mockResolvedValue({ user: publicUser, token: "google-jwt" }),
    });

    const req = {
      body: {
        code: "google-auth-code-1234567890",
        redirectUri: "http://localhost:5173/auth/google/callback",
      },
    } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.google(req, res as any, next);

    expect(setAuthCookie).toHaveBeenCalledWith(res, "google-jwt");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: publicUser });
  });

  it("logout() revoga token e limpa cookie", async () => {
    const { controller } = buildController();
    const req = { tokenJti: "jti-1", tokenExp: Math.floor(Date.now() / 1000) + 3600 } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.logout(req, res as any, next);

    expect(revokeToken).toHaveBeenCalled();
    expect(clearAuthCookie).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("me() retorna null quando não há sessão", async () => {
    resolveUserId.mockResolvedValue(null);
    const { controller } = buildController();
    const res = buildResponse();
    const next = jest.fn();

    await controller.me({} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(null);
  });

  it("me() retorna perfil do usuário autenticado", async () => {
    const publicUser = buildUser().toPublic();
    resolveUserId.mockResolvedValue("user-1");
    const { controller, authService } = buildController({
      getProfile: jest.fn().mockResolvedValue(publicUser),
    });

    const res = buildResponse();
    const next = jest.fn();

    await controller.me({} as any, res as any, next);

    expect(authService.getProfile).toHaveBeenCalledWith("user-1");
    expect(res.json).toHaveBeenCalledWith(publicUser);
  });

  it("updateAvatar() retorna 401 sem userId na requisição", async () => {
    const { controller } = buildController();
    const req = { body: { presetId: "blue-bot" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.updateAvatar(req, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
  });

  it("updateAvatar() retorna usuário atualizado", async () => {
    const publicUser = buildUser({ avatarUrl: "/api/avatars/blue-bot.svg" }).toPublic();
    const { controller, authService } = buildController({
      updateAvatar: jest.fn().mockResolvedValue(publicUser),
    });

    const req = { userId: "user-1", body: { presetId: "blue-bot" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.updateAvatar(req, res as any, next);

    expect(authService.updateAvatar).toHaveBeenCalledWith("user-1", { presetId: "blue-bot" });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user: publicUser });
  });

});

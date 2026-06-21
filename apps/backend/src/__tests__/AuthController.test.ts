import { AuthController } from "../controllers/AuthController";
import { AuthService } from "../services/AuthService";
import { MfaService } from "../services/MfaService";
import { CaptchaVerifier } from "../services/CaptchaVerifier";
import { resolveUserIdFromRequest } from "../middlewares/authMiddleware";
import { TokenService } from "../utils/TokenService";
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
  user.mfaEnabled = false;
  user.isEmailVerified = true;
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

  function buildController(
    authOverrides: Partial<AuthService> = {},
    mfaOverrides: Partial<MfaService> = {}
  ) {
    const authService = {
      register: jest.fn(),
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
      getProfile: jest.fn(),
      updateAvatar: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      ...authOverrides,
    } as unknown as AuthService;

    const mfaService = {
      setup: jest.fn(),
      enable: jest.fn(),
      disable: jest.fn(),
      verifyCode: jest.fn(),
      ...mfaOverrides,
    } as unknown as MfaService;

    return {
      controller: new AuthController(authService, mfaService),
      authService,
      mfaService,
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

  it("login() retorna usuário e cookie quando MFA não é exigido", async () => {
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

  it("login() retorna mfaRequired sem definir cookie de sessão", async () => {
    const { controller } = buildController({
      login: jest.fn().mockResolvedValue({ mfaRequired: true, mfaToken: "mfa-token" }),
    });

    const req = {
      body: { email: "lara@email.com", password: "Senha123", captchaToken: "captcha" },
      ip: "127.0.0.1",
    } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.login(req, res as any, next);

    expect(setAuthCookie).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ mfaRequired: true, mfaToken: "mfa-token" });
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

  it("verifyEmail() confirma e-mail com token válido", async () => {
    const { controller, authService } = buildController({
      verifyEmail: jest.fn().mockResolvedValue(undefined),
    });

    const req = { query: { token: "valid-token-1234567890" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.verifyEmail(req, res as any, next);

    expect(authService.verifyEmail).toHaveBeenCalledWith("valid-token-1234567890");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("resendVerification() responde com mensagem genérica", async () => {
    const { controller, authService } = buildController({
      resendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    });

    const req = { body: { email: "lara@email.com" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.resendVerification(req, res as any, next);

    expect(authService.resendVerificationEmail).toHaveBeenCalledWith("lara@email.com");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("mfaSetup() retorna QR code e secret", async () => {
    const setup = { qrCodeDataUrl: "data:image/png;base64,abc", secret: "SECRET" };
    const { controller, authService, mfaService } = buildController(
      { getProfile: jest.fn().mockResolvedValue(buildUser().toPublic()) },
      { setup: jest.fn().mockResolvedValue(setup) }
    );

    const req = { userId: "user-1" } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.mfaSetup(req, res as any, next);

    expect(authService.getProfile).toHaveBeenCalledWith("user-1");
    expect(mfaService.setup).toHaveBeenCalledWith("user-1", "lara@email.com");
    expect(res.json).toHaveBeenCalledWith(setup);
  });

  it("mfaEnable() habilita MFA com código válido", async () => {
    const { controller, mfaService } = buildController({}, {
      enable: jest.fn().mockResolvedValue(undefined),
    });

    const req = { userId: "user-1", body: { code: "123456" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.mfaEnable(req, res as any, next);

    expect(mfaService.enable).toHaveBeenCalledWith("user-1", "123456");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("mfaDisable() desabilita MFA", async () => {
    const { controller, mfaService } = buildController({}, {
      disable: jest.fn().mockResolvedValue(undefined),
    });

    const req = { userId: "user-1", body: { code: "654321" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.mfaDisable(req, res as any, next);

    expect(mfaService.disable).toHaveBeenCalledWith("user-1", "654321");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("mfaVerify() rejeita token MFA inválido", async () => {
    const { controller } = buildController();
    const req = { body: { mfaToken: "token-invalido-jwt", code: "123456" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.mfaVerify(req, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
  });

  it("mfaVerify() completa login com código TOTP válido", async () => {
    const publicUser = buildUser().toPublic();
    const mfaToken = TokenService.signMfaPending("user-1");

    const { controller, mfaService, authService } = buildController(
      { getProfile: jest.fn().mockResolvedValue(publicUser) },
      { verifyCode: jest.fn().mockResolvedValue(true) }
    );

    const req = { body: { mfaToken, code: "123456" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.mfaVerify(req, res as any, next);

    expect(mfaService.verifyCode).toHaveBeenCalledWith("user-1", "123456");
    expect(authService.getProfile).toHaveBeenCalledWith("user-1");
    expect(setAuthCookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ user: publicUser });
  });

  it("mfaVerify() rejeita código TOTP inválido", async () => {
    const mfaToken = TokenService.signMfaPending("user-1");
    const { controller } = buildController({}, {
      verifyCode: jest.fn().mockResolvedValue(false),
    });

    const req = { body: { mfaToken, code: "000000" } } as any;
    const res = buildResponse();
    const next = jest.fn();

    await controller.mfaVerify(req, res as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect((next.mock.calls[0][0] as AppError).statusCode).toBe(400);
  });
});

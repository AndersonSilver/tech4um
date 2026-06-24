import { Request, Response, NextFunction } from "express";
import {
  authMiddleware,
  extractToken,
  resolveUserIdFromRequest,
} from "../middlewares/authMiddleware";
import { TokenService } from "../utils/TokenService";
import { tokenBlacklist } from "../utils/TokenBlacklist";
import { AUTH_COOKIE_NAME } from "../utils/authCookie";
import { AppError } from "../utils/AppError";

jest.mock("../utils/TokenBlacklist", () => ({
  tokenBlacklist: { isRevoked: jest.fn() },
}));

function buildRequest(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    headers: {},
    ...overrides,
  } as Request;
}

function buildNext() {
  return jest.fn() as jest.Mock & NextFunction;
}

describe("authMiddleware", () => {
  const isRevoked = tokenBlacklist.isRevoked as jest.Mock;

  beforeEach(() => {
    isRevoked.mockResolvedValue(false);
  });

  describe("extractToken", () => {
    it("prioriza cookie de autenticação", () => {
      const req = buildRequest({
        cookies: { [AUTH_COOKIE_NAME]: "cookie-token" },
        headers: { authorization: "Bearer header-token" },
      });
      expect(extractToken(req)).toBe("cookie-token");
    });

    it("usa Authorization Bearer como fallback", () => {
      const req = buildRequest({
        headers: { authorization: "Bearer header-token" },
      });
      expect(extractToken(req)).toBe("header-token");
    });

    it("retorna null quando não há token", () => {
      expect(extractToken(buildRequest())).toBeNull();
    });
  });

  describe("resolveUserIdFromRequest", () => {
    it("retorna sub do token válido", async () => {
      const token = TokenService.sign({ sub: "user-99", username: "ana" });
      const req = buildRequest({ cookies: { [AUTH_COOKIE_NAME]: token } });

      await expect(resolveUserIdFromRequest(req)).resolves.toBe("user-99");
    });

    it("retorna null para token revogado", async () => {
      const token = TokenService.sign({ sub: "user-99", username: "ana" });
      isRevoked.mockResolvedValue(true);
      const req = buildRequest({ cookies: { [AUTH_COOKIE_NAME]: token } });

      await expect(resolveUserIdFromRequest(req)).resolves.toBeNull();
    });

    it("retorna null sem token", async () => {
      await expect(resolveUserIdFromRequest(buildRequest())).resolves.toBeNull();
    });
  });

  describe("authMiddleware", () => {
    it("anexa userId e chama next para token válido", async () => {
      const token = TokenService.sign({ sub: "user-1", username: "lara" });
      const req = buildRequest({ cookies: { [AUTH_COOKIE_NAME]: token } });
      const next = buildNext();

      await authMiddleware(req, {} as Response, next);

      expect((req as any).userId).toBe("user-1");
      expect((req as any).tokenJti).toBeDefined();
      expect(next).toHaveBeenCalledWith();
    });

    it("propaga AppError quando token ausente", async () => {
      const next = buildNext();
      await authMiddleware(buildRequest(), {} as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next.mock.calls[0][0] as AppError).statusCode).toBe(401);
    });

    it("rejeita sessão revogada", async () => {
      const token = TokenService.sign({ sub: "user-1", username: "lara" });
      isRevoked.mockResolvedValue(true);
      const next = buildNext();

      await authMiddleware(
        buildRequest({ cookies: { [AUTH_COOKIE_NAME]: token } }),
        {} as Response,
        next
      );

      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    });
  });
});

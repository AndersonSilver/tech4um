import { Response } from "express";
import { AUTH_COOKIE_NAME, setAuthCookie, clearAuthCookie } from "../utils/authCookie";

function buildResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;
}

describe("authCookie", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("define cookie httpOnly com nome correto em desenvolvimento", () => {
    process.env.NODE_ENV = "test";
    const res = buildResponse();

    setAuthCookie(res, "jwt-token");

    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      "jwt-token",
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 1000 * 60 * 60 * 2,
      })
    );
  });

  it("usa secure e sameSite strict em produção", () => {
    process.env.NODE_ENV = "production";
    const res = buildResponse();

    setAuthCookie(res, "jwt-token");

    expect(res.cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      "jwt-token",
      expect.objectContaining({
        secure: true,
        sameSite: "strict",
      })
    );
  });

  it("clearAuthCookie remove o cookie com as mesmas opções de path", () => {
    process.env.NODE_ENV = "test";
    const res = buildResponse();

    clearAuthCookie(res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.objectContaining({
        path: "/",
        secure: false,
        sameSite: "lax",
      })
    );
  });
});

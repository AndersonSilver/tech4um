import { Response } from "express";

export const AUTH_COOKIE_NAME = "tech4um_token";

export function setAuthCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 2, // 2h, alinhado ao JWT_EXPIRES_IN padrão
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie(AUTH_COOKIE_NAME, {
    path: "/",
    sameSite: isProduction ? "strict" : "lax",
    secure: isProduction,
  });
}

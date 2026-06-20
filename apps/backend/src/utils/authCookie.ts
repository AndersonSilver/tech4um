import { Response } from "express";

export const AUTH_COOKIE_NAME = "tech4um_token";

/**
 * Cookie httpOnly + Secure (em produção) + SameSite=Strict.
 *
 * Por que isso é mais seguro que localStorage:
 * - httpOnly: JavaScript não consegue ler o token, mesmo com XSS.
 * - Secure: só é enviado em HTTPS (em produção).
 * - SameSite=Strict: o navegador não envia o cookie em requisições
 *   originadas de outro site, o que já mitiga CSRF na grande maioria dos casos
 *   (trade-off: fluxos de login que dependam de redirect cross-site quebram;
 *   nosso fluxo de login com Google é feito via POST direto ao nosso backend,
 *   então não é afetado).
 */
export function setAuthCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 2, // 2h, alinhado ao JWT_EXPIRES_IN padrão
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
}

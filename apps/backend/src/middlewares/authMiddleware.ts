import { Request, Response, NextFunction } from "express";
import { TokenService } from "../utils/TokenService";
import { tokenBlacklist } from "../utils/TokenBlacklist";
import { AppError } from "../utils/AppError";
import { AUTH_COOKIE_NAME } from "../utils/authCookie";

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  // Fallback para Authorization: Bearer <token> — útil para testes automatizados
  // e clientes não-browser (ex.: scripts, mobile nativo) que não usam cookies.
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);

  return null;
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError("Token não fornecido", 401);

    const payload = TokenService.verify(token);

    if (await tokenBlacklist.isRevoked(payload.jti)) {
      throw new AppError("Sessão expirada. Faça login novamente.", 401);
    }

    (req as any).userId = payload.sub;
    (req as any).tokenJti = payload.jti;
    (req as any).tokenExp = payload.exp;
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError("Token inválido ou expirado", 401));
  }
}

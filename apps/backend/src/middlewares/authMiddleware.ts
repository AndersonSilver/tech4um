import { Request, Response, NextFunction } from "express";
import { TokenService } from "../utils/TokenService";
import { AppError } from "../utils/AppError";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) throw new AppError("Token não fornecido", 401);

  const [, token] = header.split(" ");
  if (!token) throw new AppError("Token inválido", 401);

  try {
    const payload = TokenService.verify(token);
    (req as any).userId = payload.sub;
    next();
  } catch {
    throw new AppError("Token inválido ou expirado", 401);
  }
}

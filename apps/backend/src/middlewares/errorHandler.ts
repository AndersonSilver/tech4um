import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    logger.warn(`Validação falhou em ${req.method} ${req.originalUrl}`, error.issues);
    return res.status(400).json({ message: "Dados inválidos", issues: error.issues });
  }

  if (error instanceof AppError) {
    logger.warn(`${error.statusCode} - ${error.message} (${req.method} ${req.originalUrl})`);
    return res.status(error.statusCode).json({ message: error.message });
  }

  logger.error(`Erro não tratado em ${req.method} ${req.originalUrl}`, {
    message: error.message,
    stack: error.stack,
  });
  return res.status(500).json({ message: "Erro interno do servidor" });
}

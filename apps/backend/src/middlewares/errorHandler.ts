import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

function isPayloadTooLarge(error: Error): boolean {
  return (
    error.message?.includes("request entity too large") ||
    (error as NodeJS.ErrnoException).type === "entity.too.large"
  );
}

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

  if (isPayloadTooLarge(error)) {
    return res.status(413).json({
      message: "Arquivo muito grande. O limite é 10MB por imagem.",
    });
  }

  logger.error(`Erro não tratado em ${req.method} ${req.originalUrl}`, {
    message: error.message,
    stack: error.stack,
  });
  return res.status(500).json({ message: "Erro interno do servidor" });
}

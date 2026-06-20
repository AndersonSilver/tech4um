import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../utils/AppError";

const userRepository = new UserRepository();

/**
 * Usado em ações que consideramos sensíveis o suficiente para exigir que o
 * e-mail já tenha sido confirmado (hoje: criar fórum). Login e leitura
 * continuam liberados para contas não verificadas — não queremos bloquear
 * totalmente o acesso por causa de um e-mail que pode nunca ter chegado.
 */
export async function requireVerifiedEmail(req: Request, _res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId as string;
    const user = await userRepository.findById(userId);

    if (!user?.isEmailVerified) {
      throw new AppError(
        "É necessário confirmar seu e-mail antes de criar um fórum. Verifique sua caixa de entrada.",
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

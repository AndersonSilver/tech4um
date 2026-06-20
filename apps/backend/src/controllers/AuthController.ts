import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/AuthService";
import { tokenBlacklist } from "../utils/TokenBlacklist";
import { setAuthCookie, clearAuthCookie } from "../utils/authCookie";

// Política de senha: mínimo 8 caracteres, com letra maiúscula, minúscula e número.
// (Sem caractere especial obrigatório para não frustrar UX além do necessário —
// extensível facilmente se a política da empresa exigir mais.)
const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter ao menos um número");

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(10),
});

export class AuthController {
  constructor(private authService: AuthService = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);
      const { user, token } = await this.authService.register(data);
      setAuthCookie(res, token);
      return res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loginSchema.parse(req.body);
      const { user, token } = await this.authService.login(data);
      setAuthCookie(res, token);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  google = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = googleLoginSchema.parse(req.body);
      const { user, token } = await this.authService.loginWithGoogle(idToken);
      setAuthCookie(res, token);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jti = (req as any).tokenJti as string | undefined;
      if (jti) tokenBlacklist.revoke(jti);
      clearAuthCookie(res);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string;
      const profile = await this.authService.getProfile(userId);
      return res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  };
}

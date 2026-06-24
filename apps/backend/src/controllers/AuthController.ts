import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/AuthService";
import { CaptchaVerifier } from "../services/CaptchaVerifier";
import { resolveUserIdFromRequest } from "../middlewares/authMiddleware";
import { tokenBlacklist } from "../utils/TokenBlacklist";
import { setAuthCookie, clearAuthCookie } from "../utils/authCookie";
import { AppError } from "../utils/AppError";
import type {
  RegisterRequestDTO,
  LoginRequestDTO,
  UpdateAvatarRequestDTO,
} from "@tech4um/shared";
import { PRESET_AVATAR_IDS } from "@tech4um/shared";

// Política de senha: mínimo 8 caracteres, com letra maiúscula, minúscula e número.
const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula")
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
  .regex(/[0-9]/, "A senha deve conter ao menos um número");

const registerSchema: z.ZodType<RegisterRequestDTO> = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: passwordSchema,
  captchaToken: z.string().min(1, "Verificação de CAPTCHA ausente."),
});

const loginSchema: z.ZodType<LoginRequestDTO> = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  captchaToken: z.string().min(1, "Verificação de CAPTCHA ausente."),
});

const googleLoginSchema = z.object({
  code: z.string().min(10),
  redirectUri: z.string().url(),
});

const updateAvatarSchema: z.ZodType<UpdateAvatarRequestDTO> = z
  .object({
    dataUrl: z.string().min(1).optional(),
    presetId: z.enum(PRESET_AVATAR_IDS).optional(),
  })
  .refine((data) => Boolean(data.dataUrl || data.presetId), {
    message: "Informe uma foto ou um avatar",
  });

export class AuthController {
  constructor(private authService: AuthService = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);
      await CaptchaVerifier.verify(data.captchaToken, req.ip, "register");

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
      await CaptchaVerifier.verify(data.captchaToken, req.ip, "login");

      const { user, token } = await this.authService.login(data);
      setAuthCookie(res, token);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };

  google = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, redirectUri } = googleLoginSchema.parse(req.body);
      const result = await this.authService.loginWithGoogle(code, redirectUri);
      setAuthCookie(res, result.token);
      return res.status(200).json({ user: result.user });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jti = (req as any).tokenJti as string | undefined;
      const exp = (req as any).tokenExp as number | undefined;
      if (jti) {
        const ttl = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 1) : 60 * 60 * 2;
        await tokenBlacklist.revoke(jti, ttl);
      }
      clearAuthCookie(res);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await resolveUserIdFromRequest(req);
      if (!userId) {
        return res.status(200).json(null);
      }

      const profile = await this.authService.getProfile(userId);
      return res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  };

  updateAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { userId?: string }).userId;
      if (!userId) {
        throw new AppError("Não autenticado", 401);
      }

      const data = updateAvatarSchema.parse(req.body);
      const user = await this.authService.updateAvatar(userId, data);
      return res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  };
}

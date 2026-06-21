import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/AuthService";
import { MfaService } from "../services/MfaService";
import { CaptchaVerifier } from "../services/CaptchaVerifier";
import { resolveUserIdFromRequest } from "../middlewares/authMiddleware";
import { TokenService } from "../utils/TokenService";
import { tokenBlacklist } from "../utils/TokenBlacklist";
import { setAuthCookie, clearAuthCookie } from "../utils/authCookie";
import { AppError } from "../utils/AppError";
import type {
  RegisterRequestDTO,
  LoginRequestDTO,
  EnableMfaRequestDTO,
  DisableMfaRequestDTO,
  VerifyMfaRequestDTO,
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

const verifyMfaSchema: z.ZodType<VerifyMfaRequestDTO> = z.object({
  mfaToken: z.string().min(10),
  code: z.string().length(6),
});

const enableMfaSchema: z.ZodType<EnableMfaRequestDTO> = z.object({
  code: z.string().length(6),
});

const disableMfaSchema: z.ZodType<DisableMfaRequestDTO> = z.object({
  code: z.string().length(6),
});

const resendVerificationSchema = z.object({ email: z.string().email() });
const verifyEmailSchema = z.object({ token: z.string().min(10) });

const updateAvatarSchema: z.ZodType<UpdateAvatarRequestDTO> = z
  .object({
    dataUrl: z.string().min(1).optional(),
    presetId: z.enum(PRESET_AVATAR_IDS).optional(),
  })
  .refine((data) => Boolean(data.dataUrl || data.presetId), {
    message: "Informe uma foto ou um avatar",
  });

export class AuthController {
  constructor(
    private authService: AuthService = new AuthService(),
    private mfaService: MfaService = new MfaService()
  ) {}

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

      const result = await this.authService.login(data);

      if ("mfaRequired" in result) {
        return res.status(200).json(result);
      }

      setAuthCookie(res, result.token);
      return res.status(200).json({ user: result.user });
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

  // ---------- Verificação de e-mail ----------

  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = verifyEmailSchema.parse(req.query);
      await this.authService.verifyEmail(token);
      return res.status(200).json({ message: "E-mail verificado com sucesso." });
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = resendVerificationSchema.parse(req.body);
      await this.authService.resendVerificationEmail(email);
      // Resposta sempre genérica/idêntica — evita confirmar se o e-mail existe.
      return res
        .status(200)
        .json({ message: "Se o e-mail existir e não estiver verificado, enviamos um novo link." });
    } catch (error) {
      next(error);
    }
  };

  // ---------- MFA ----------

  mfaSetup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string;
      const profile = await this.authService.getProfile(userId);
      const setup = await this.mfaService.setup(userId, profile.email);
      return res.status(200).json(setup);
    } catch (error) {
      next(error);
    }
  };

  mfaEnable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string;
      const { code } = enableMfaSchema.parse(req.body);
      await this.mfaService.enable(userId, code);
      return res.status(200).json({ message: "MFA habilitado com sucesso." });
    } catch (error) {
      next(error);
    }
  };

  mfaDisable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string;
      const { code } = disableMfaSchema.parse(req.body);
      await this.mfaService.disable(userId, code);
      return res.status(200).json({ message: "MFA desabilitado." });
    } catch (error) {
      next(error);
    }
  };

  // Completa o login quando a conta tem MFA habilitado (segunda etapa).
  mfaVerify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mfaToken, code } = verifyMfaSchema.parse(req.body);

      let userId: string;
      try {
        const payload = TokenService.verifyMfaPending(mfaToken);
        userId = payload.sub;
      } catch {
        throw new AppError("Sessão de login expirada. Faça login novamente.", 401);
      }

      const isValid = await this.mfaService.verifyCode(userId, code);
      if (!isValid) throw new AppError("Código inválido.", 400);

      const profile = await this.authService.getProfile(userId);
      const token = TokenService.sign({ sub: userId, username: profile.username });

      setAuthCookie(res, token);
      return res.status(200).json({ user: profile });
    } catch (error) {
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/AuthService";
import type { RegisterRequestDTO, LoginRequestDTO } from "@tech4um/shared";

const registerSchema: z.ZodType<RegisterRequestDTO> = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema: z.ZodType<LoginRequestDTO> = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(10),
});

export class AuthController {
  constructor(private authService: AuthService = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = registerSchema.parse(req.body);
      const result = await this.authService.register(data);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = loginSchema.parse(req.body);
      const result = await this.authService.login(data);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  google = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken } = googleLoginSchema.parse(req.body);
      const result = await this.authService.loginWithGoogle(idToken);
      return res.status(200).json(result);
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

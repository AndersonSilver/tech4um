import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

export class CaptchaVerifier {
  static async verify(
    token: string,
    remoteIp?: string,
    expectedAction?: string
  ): Promise<void> {
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!secret) {
      logger.warn("RECAPTCHA_SECRET_KEY não configurado — pulando verificação de CAPTCHA (dev only).");
      return;
    }

    if (!token) {
      throw new AppError("Verificação de CAPTCHA ausente.", 400);
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.append("remoteip", remoteIp);

    const response = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await response.json()) as RecaptchaVerifyResponse;

    if (!data.success) {
      const errors = data["error-codes"] ?? [];
      logger.warn("Verificação de CAPTCHA falhou", { errors });

      const needsMigration = errors.some((code) =>
        code.toLowerCase().includes("migrate")
      );
      if (needsMigration) {
        throw new AppError(
          "A chave reCAPTCHA precisa ser migrada no Google Cloud. Acesse https://www.google.com/recaptcha/admin e migre a site key para um projeto GCP (sem alterar o código).",
          503
        );
      }

      throw new AppError("Falha na verificação de CAPTCHA. Tente novamente.", 400);
    }

    if (data.score !== undefined) {
      const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");
      if (data.score < minScore) {
        logger.warn("Score de reCAPTCHA v3 abaixo do limite", {
          score: data.score,
          minScore,
          action: data.action,
        });
        throw new AppError("Falha na verificação de CAPTCHA. Tente novamente.", 400);
      }
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      logger.warn("Ação de reCAPTCHA v3 inesperada", {
        expected: expectedAction,
        received: data.action,
      });
      throw new AppError("Falha na verificação de CAPTCHA. Tente novamente.", 400);
    }
  }
}

import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Cloudflare Turnstile foi escolhido em vez do reCAPTCHA por ser gratuito,
 * mais simples de auto-hospedar (não exige conta Google) e não depender de
 * cookies de terceiros para funcionar — bom encaixe para um VPS próprio.
 */
export class CaptchaVerifier {
  static async verify(token: string, remoteIp?: string): Promise<void> {
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
      // Em desenvolvimento, é comum não ter as chaves configuradas ainda.
      // Em produção, isso é tratado como erro fatal na inicialização do servidor
      // (ver assertRequiredEnv em server.ts), então chegar aqui sem secret só
      // deve acontecer em dev — registramos um aviso e deixamos passar.
      logger.warn("TURNSTILE_SECRET_KEY não configurado — pulando verificação de CAPTCHA (dev only).");
      return;
    }

    if (!token) {
      throw new AppError("Verificação de CAPTCHA ausente.", 400);
    }

    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.append("remoteip", remoteIp);

    const response = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await response.json()) as TurnstileVerifyResponse;

    if (!data.success) {
      logger.warn("Verificação de CAPTCHA falhou", { errors: data["error-codes"] });
      throw new AppError("Falha na verificação de CAPTCHA. Tente novamente.", 400);
    }
  }
}

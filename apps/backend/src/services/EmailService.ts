import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../utils/logger";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "Configuração de SMTP ausente (SMTP_HOST/SMTP_USER/SMTP_PASSWORD). Configure-a para habilitar envio de e-mails."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export class EmailService {
  static async sendVerificationEmail(to: string, verificationUrl: string) {
    await this.send({
      to,
      subject: "Confirme seu e-mail no Tech4um",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color:#1772B2;">Bem-vindo(a) ao Tech4um!</h2>
          <p>Para concluir seu cadastro, confirme seu e-mail clicando no botão abaixo:</p>
          <p style="margin: 24px 0;">
            <a href="${verificationUrl}" style="background:#1772B2;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
              Confirmar e-mail
            </a>
          </p>
          <p style="color:#757575;font-size:13px;">Se você não criou essa conta, ignore este e-mail. O link expira em 24 horas.</p>
        </div>
      `,
    });
  }

  private static async send(options: { to: string; subject: string; html: string }) {
    try {
      const from = process.env.SMTP_FROM || "Tech4um <no-reply@tech4um.dev>";
      await getTransporter().sendMail({ from, ...options });
    } catch (error) {
      // Não derruba o fluxo de cadastro/login por uma falha de e-mail — mas
      // fica bem visível no log, já que é uma falha funcional relevante
      // (usuário pode nunca conseguir confirmar a conta).
      logger.error("Falha ao enviar e-mail", {
        to: options.to,
        subject: options.subject,
        error: (error as Error).message,
      });
    }
  }
}

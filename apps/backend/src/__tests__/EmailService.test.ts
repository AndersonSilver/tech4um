import nodemailer from "nodemailer";
import { EmailService } from "../services/EmailService";
import { logger } from "../utils/logger";

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

jest.mock("../utils/logger", () => ({
  logger: { error: jest.fn() },
}));

describe("EmailService", () => {
  const createTransport = nodemailer.createTransport as jest.Mock;
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    sendMail.mockResolvedValue({ messageId: "msg-1" });
    createTransport.mockReturnValue({ sendMail });
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@test.com";
    process.env.SMTP_PASSWORD = "secret";
    process.env.SMTP_FROM = "Tech4um <no-reply@test.com>";
  });

  it("sendVerificationEmail() registra falha quando SMTP não está configurado", async () => {
    jest.resetModules();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    const { EmailService: FreshEmailService } = await import("../services/EmailService");
    const { logger: freshLogger } = await import("../utils/logger");

    await expect(
      FreshEmailService.sendVerificationEmail("user@test.com", "http://localhost/verify")
    ).resolves.toBeUndefined();

    expect(freshLogger.error).toHaveBeenCalledWith(
      "Falha ao enviar e-mail",
      expect.objectContaining({
        to: "user@test.com",
        error: expect.stringContaining("Configuração de SMTP ausente"),
      })
    );
  });

  it("sendVerificationEmail() envia e-mail com link de confirmação", async () => {
    await EmailService.sendVerificationEmail(
      "user@test.com",
      "http://localhost:5173/verify-email?token=abc"
    );

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: "smtp.test.com",
        port: 587,
        auth: { user: "user@test.com", pass: "secret" },
      })
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: "Confirme seu e-mail no Tech4um",
        from: "Tech4um <no-reply@test.com>",
        html: expect.stringContaining("http://localhost:5173/verify-email?token=abc"),
      })
    );
  });

  it("sendVerificationEmail() registra erro sem lançar exceção quando SMTP falha", async () => {
    sendMail.mockRejectedValue(new Error("SMTP indisponível"));

    await expect(
      EmailService.sendVerificationEmail("user@test.com", "http://localhost/verify")
    ).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      "Falha ao enviar e-mail",
      expect.objectContaining({ to: "user@test.com" })
    );
  });
});

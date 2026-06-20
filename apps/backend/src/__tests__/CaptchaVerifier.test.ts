import { CaptchaVerifier } from "../services/CaptchaVerifier";

describe("CaptchaVerifier", () => {
  const originalFetch = global.fetch;
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;

  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = "secret-de-teste";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.TURNSTILE_SECRET_KEY = originalSecret;
  });

  it("não lança erro quando a verificação retorna success=true", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    }) as any;

    await expect(CaptchaVerifier.verify("token-valido")).resolves.toBeUndefined();
  });

  it("lança AppError quando a verificação retorna success=false", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false, "error-codes": ["invalid-input-response"] }),
    }) as any;

    await expect(CaptchaVerifier.verify("token-invalido")).rejects.toThrow(
      "Falha na verificação de CAPTCHA"
    );
  });

  it("lança AppError quando nenhum token é enviado", async () => {
    await expect(CaptchaVerifier.verify("")).rejects.toThrow("Verificação de CAPTCHA ausente");
  });

  it("não falha (apenas avisa) se TURNSTILE_SECRET_KEY não estiver configurado (modo dev)", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    await expect(CaptchaVerifier.verify("qualquer-coisa")).resolves.toBeUndefined();
  });
});

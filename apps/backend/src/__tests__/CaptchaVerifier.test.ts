import { CaptchaVerifier } from "../services/CaptchaVerifier";

describe("CaptchaVerifier", () => {
  const originalFetch = global.fetch;
  const originalSecret = process.env.RECAPTCHA_SECRET_KEY;
  const originalMinScore = process.env.RECAPTCHA_MIN_SCORE;

  beforeEach(() => {
    process.env.RECAPTCHA_SECRET_KEY = "secret-de-teste";
    delete process.env.RECAPTCHA_MIN_SCORE;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.RECAPTCHA_SECRET_KEY = originalSecret;
    process.env.RECAPTCHA_MIN_SCORE = originalMinScore;
  });

  it("não lança erro quando a verificação retorna success=true", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, score: 0.9, action: "login" }),
    }) as any;

    await expect(CaptchaVerifier.verify("token-valido", undefined, "login")).resolves.toBeUndefined();
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

  it("rejeita score abaixo do mínimo no reCAPTCHA v3", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, score: 0.2, action: "login" }),
    }) as any;

    await expect(CaptchaVerifier.verify("token-valido", undefined, "login")).rejects.toThrow(
      "Falha na verificação de CAPTCHA"
    );
  });

  it("rejeita ação inesperada no reCAPTCHA v3", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, score: 0.9, action: "register" }),
    }) as any;

    await expect(CaptchaVerifier.verify("token-valido", undefined, "login")).rejects.toThrow(
      "Falha na verificação de CAPTCHA"
    );
  });

  it("não falha (apenas avisa) se RECAPTCHA_SECRET_KEY não estiver configurado (modo dev)", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    await expect(CaptchaVerifier.verify("qualquer-coisa")).resolves.toBeUndefined();
  });
});

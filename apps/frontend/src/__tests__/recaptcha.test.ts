import { describe, it, expect, vi, beforeEach } from "vitest";

describe("recaptcha", () => {
  beforeEach(() => {
    vi.resetModules();
    document.querySelectorAll('script[data-recaptcha-v3="true"]').forEach((el) => el.remove());
    delete (window as { grecaptcha?: unknown }).grecaptcha;
  });

  it("rejeita quando site key não está configurada", async () => {
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "");
    const { executeRecaptcha } = await import("../services/recaptcha");
    await expect(executeRecaptcha("login")).rejects.toThrow("VITE_RECAPTCHA_SITE_KEY não configurada.");
    vi.unstubAllEnvs();
  });

  it("executa grecaptcha quando já carregado", async () => {
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");
    const execute = vi.fn().mockResolvedValue("captcha-token");
    const ready = vi.fn((cb: () => void) => cb());
    (window as any).grecaptcha = { execute, ready };

    const { executeRecaptcha } = await import("../services/recaptcha");
    await expect(executeRecaptcha("login")).resolves.toBe("captcha-token");
    expect(execute).toHaveBeenCalledWith("test-site-key", { action: "login" });
    vi.unstubAllEnvs();
  });

  it("injeta script quando grecaptcha não existe", async () => {
    vi.stubEnv("VITE_RECAPTCHA_SITE_KEY", "test-site-key");
    const execute = vi.fn().mockResolvedValue("token-abc");
    const ready = vi.fn((cb: () => void) => cb());

    const { executeRecaptcha } = await import("../services/recaptcha");
    const promise = executeRecaptcha("register");

    const script = document.querySelector<HTMLScriptElement>('script[data-recaptcha-v3="true"]');
    expect(script?.src).toContain("test-site-key");

    (window as any).grecaptcha = { execute, ready };
    script?.onload?.(new Event("load"));

    await expect(promise).resolves.toBe("token-abc");
    vi.unstubAllEnvs();
  });
});

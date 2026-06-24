import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadGoogleIdentityScript, unloadGoogleIdentityScript } from "../services/googleIdentity";

describe("googleIdentity", () => {
  beforeEach(() => {
    unloadGoogleIdentityScript();
    delete (window as { google?: unknown }).google;
  });

  afterEach(() => {
    unloadGoogleIdentityScript();
  });

  it("resolve imediatamente quando google.accounts.oauth2 já existe", async () => {
    (window as any).google = { accounts: { oauth2: {} } };
    await expect(loadGoogleIdentityScript()).resolves.toBeUndefined();
  });

  it("injeta script e resolve no onload", async () => {
    const promise = loadGoogleIdentityScript();
    const script = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
    expect(script).toBeTruthy();
    expect(script?.src).toContain("accounts.google.com/gsi/client");

    script?.onload?.(new Event("load"));
    await expect(promise).resolves.toBeUndefined();
  });

  it("rejeita quando script falha ao carregar", async () => {
    const promise = loadGoogleIdentityScript();
    const script = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
    script?.onerror?.(new Event("error"));
    await expect(promise).rejects.toThrow("Falha ao carregar Google Identity.");
  });

  it("unloadGoogleIdentityScript remove o script do DOM", () => {
    void loadGoogleIdentityScript();
    unloadGoogleIdentityScript();
    expect(document.querySelector('script[data-google-identity="true"]')).toBeNull();
  });
});

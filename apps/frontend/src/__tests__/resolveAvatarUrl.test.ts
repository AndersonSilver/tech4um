import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getUserInitial, resolveAvatarUrl } from "../utils/resolveAvatarUrl";

describe("resolveAvatarUrl", () => {
  const originalOrigin = window.location.origin;

  beforeEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "http://localhost:5173" },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: originalOrigin },
    });
  });

  it("retorna null quando não há avatar", () => {
    expect(resolveAvatarUrl(undefined)).toBeNull();
    expect(resolveAvatarUrl(null)).toBeNull();
  });

  it("preserva URLs absolutas", () => {
    expect(resolveAvatarUrl("https://lh3.googleusercontent.com/a/avatar")).toBe(
      "https://lh3.googleusercontent.com/a/avatar"
    );
  });

  it("resolve caminhos relativos com a origem atual", () => {
    expect(resolveAvatarUrl("/api/avatars/blue-bot.svg")).toBe(
      "http://localhost:5173/api/avatars/blue-bot.svg"
    );
  });
});

describe("getUserInitial", () => {
  it("retorna a primeira letra maiúscula do username", () => {
    expect(getUserInitial("lara")).toBe("L");
    expect(getUserInitial("Anderson")).toBe("A");
  });
});

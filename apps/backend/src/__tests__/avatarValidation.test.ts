import { PRESET_AVATARS } from "@tech4um/shared";
import { getPresetAvatarPath, isValidAvatarUrl } from "../utils/avatarValidation";

describe("avatarValidation", () => {
  it("getPresetAvatarPath retorna path do preset existente", () => {
    const preset = PRESET_AVATARS[0];
    expect(getPresetAvatarPath(preset.id)).toBe(preset.path);
  });

  it("getPresetAvatarPath retorna null para id desconhecido", () => {
    expect(getPresetAvatarPath("inexistente")).toBeNull();
  });

  it("isValidAvatarUrl aceita URL https até 2048 caracteres", () => {
    expect(isValidAvatarUrl("https://cdn.example.com/avatar.png")).toBe(true);
    expect(isValidAvatarUrl("https://" + "a".repeat(2040))).toBe(true);
    expect(isValidAvatarUrl("https://" + "a".repeat(2041))).toBe(false);
  });

  it("isValidAvatarUrl aceita paths de preset", () => {
    expect(isValidAvatarUrl(PRESET_AVATARS[0].path)).toBe(true);
  });

  it("isValidAvatarUrl aceita upload interno válido", () => {
    expect(isValidAvatarUrl("/api/uploads/abc-123.webp")).toBe(true);
    expect(isValidAvatarUrl("/api/uploads/../etc/passwd")).toBe(false);
  });
});

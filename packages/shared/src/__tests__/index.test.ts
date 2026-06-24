import { describe, it, expect } from "vitest";
import {
  PRESET_AVATARS,
  PRESET_AVATAR_IDS,
  QUICK_REACTION_EMOJIS,
  SOCKET_EVENTS,
} from "../index";

describe("@tech4um/shared", () => {
  it("PRESET_AVATARS tem ids únicos e paths consistentes", () => {
    const ids = PRESET_AVATARS.map((avatar) => avatar.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(PRESET_AVATAR_IDS[0]).toBe(PRESET_AVATARS[0].id);
    for (const avatar of PRESET_AVATARS) {
      expect(avatar.path).toMatch(/^\/api\/avatars\/.+\.svg$/);
    }
  });

  it("QUICK_REACTION_EMOJIS contém emojis de reação rápida", () => {
    expect(QUICK_REACTION_EMOJIS).toContain("👍");
    expect(QUICK_REACTION_EMOJIS.length).toBeGreaterThanOrEqual(4);
  });

  it("SOCKET_EVENTS define pares client/server sem colisão de valores", () => {
    const values = Object.values(SOCKET_EVENTS);
    expect(new Set(values).size).toBe(values.length);
    expect(SOCKET_EVENTS.JOIN_FORUM).toBe("join_forum");
    expect(SOCKET_EVENTS.NEW_PUBLIC_MESSAGE).toBe("new_public_message");
  });
});

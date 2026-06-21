import { describe, it, expect, beforeEach } from "vitest";
import {
  loadRecentEmojis,
  saveRecentEmoji,
  RECENT_EMOJIS_KEY,
  MAX_RECENT_EMOJIS,
} from "../data/chatEmojis";

describe("chatEmojis", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loadRecentEmojis() retorna lista vazia sem dados salvos", () => {
    expect(loadRecentEmojis()).toEqual([]);
  });

  it("saveRecentEmoji() persiste emoji recente no localStorage", () => {
    saveRecentEmoji("👍");

    expect(loadRecentEmojis()).toEqual(["👍"]);
    expect(JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY) ?? "[]")).toEqual(["👍"]);
  });

  it("saveRecentEmoji() move emoji repetido para o início", () => {
    saveRecentEmoji("👍");
    saveRecentEmoji("❤️");
    saveRecentEmoji("👍");

    expect(loadRecentEmojis()).toEqual(["👍", "❤️"]);
  });

  it("saveRecentEmoji() limita a quantidade máxima de recentes", () => {
    for (let index = 0; index < MAX_RECENT_EMOJIS + 5; index += 1) {
      saveRecentEmoji(`emoji-${index}`);
    }

    expect(loadRecentEmojis()).toHaveLength(MAX_RECENT_EMOJIS);
    expect(loadRecentEmojis()[0]).toBe(`emoji-${MAX_RECENT_EMOJIS + 4}`);
  });

  it("loadRecentEmojis() ignora dados inválidos no localStorage", () => {
    localStorage.setItem(RECENT_EMOJIS_KEY, "{invalid-json");

    expect(loadRecentEmojis()).toEqual([]);
  });
});

import { describe, it, expect } from "vitest";
import { buildSenderProfileIndex } from "../utils/senderProfiles";
import { Message } from "../types";

describe("buildSenderProfileIndex", () => {
  it("usa o avatar mais recente das mensagens para o mesmo remetente", () => {
    const messages: Message[] = [
      {
        id: "m1",
        content: "oi",
        type: "public",
        senderId: "u1",
        forumId: "f1",
        createdAt: "2026-01-01T10:00:00.000Z",
        sender: {
          id: "u1",
          username: "Talia",
          email: "talia@email.com",
          avatarUrl: "/api/avatars/old.svg",
          isEmailVerified: true,
          mfaEnabled: false,
        },
      },
      {
        id: "m2",
        content: "oi de novo",
        type: "public",
        senderId: "u1",
        forumId: "f1",
        createdAt: "2026-01-01T11:00:00.000Z",
        sender: {
          id: "u1",
          username: "Talia",
          email: "talia@email.com",
          avatarUrl: "/api/avatars/orange-fox.svg",
          isEmailVerified: true,
          mfaEnabled: false,
        },
      },
    ];

    const profiles = buildSenderProfileIndex({ messages });

    expect(profiles.get("u1")?.avatarUrl).toBe("/api/avatars/orange-fox.svg");
  });

  it("prioriza o usuário autenticado para as próprias mensagens", () => {
    const messages: Message[] = [
      {
        id: "m1",
        content: "oi",
        type: "public",
        senderId: "u1",
        forumId: "f1",
        createdAt: "2026-01-01T10:00:00.000Z",
        sender: {
          id: "u1",
          username: "Talia",
          email: "talia@email.com",
          avatarUrl: "/api/avatars/old.svg",
          isEmailVerified: true,
          mfaEnabled: false,
        },
      },
    ];

    const profiles = buildSenderProfileIndex({
      messages,
      currentUser: {
        id: "u1",
        username: "Talia",
        email: "talia@email.com",
        avatarUrl: "/api/avatars/orange-fox.svg",
        isEmailVerified: true,
        mfaEnabled: false,
      },
    });

    expect(profiles.get("u1")?.avatarUrl).toBe("/api/avatars/orange-fox.svg");
  });
});

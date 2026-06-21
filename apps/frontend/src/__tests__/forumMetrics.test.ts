import { describe, it, expect } from "vitest";
import {
  countOnlineParticipants,
  countTotalParticipants,
  filterForumsByActivity,
  getForumActivityLabel,
  sortForums,
} from "../utils/forumMetrics";
import { Forum } from "../types";

function buildForum(overrides: Partial<Forum> = {}): Forum {
  return {
    id: "1",
    name: "Forum",
    ownerId: "owner",
    createdAt: "2026-01-01T00:00:00.000Z",
    participants: [],
    ...overrides,
  };
}

describe("forumMetrics", () => {
  it("conta participantes online", () => {
    const forum = buildForum({
      participants: [
        { id: "1", userId: "a", isOnline: true, user: undefined as never },
        { id: "2", userId: "b", isOnline: false, user: undefined as never },
      ],
    });

    expect(countOnlineParticipants(forum)).toBe(1);
    expect(countTotalParticipants(forum)).toBe(2);
  });

  it("monta rótulo de atividade", () => {
    const forum = buildForum({
      participants: [
        { id: "1", userId: "a", isOnline: true, user: undefined as never },
        { id: "2", userId: "b", isOnline: true, user: undefined as never },
      ],
    });

    expect(getForumActivityLabel(forum)).toBe("2 online");
  });

  it("ordena por popularidade (online primeiro)", () => {
    const popular = buildForum({
      id: "popular",
      createdAt: "2026-01-01T00:00:00.000Z",
      participants: [
        { id: "1", userId: "a", isOnline: true, user: undefined as never },
        { id: "2", userId: "b", isOnline: true, user: undefined as never },
      ],
    });
    const recent = buildForum({
      id: "recent",
      createdAt: "2026-06-01T00:00:00.000Z",
      participants: [
        { id: "3", userId: "c", isOnline: false, user: undefined as never },
      ],
    });

    const sorted = sortForums([recent, popular], "popular");
    expect(sorted[0].id).toBe("popular");
  });

  it("ordena por data quando modo recent", () => {
    const older = buildForum({ id: "older", createdAt: "2026-01-01T00:00:00.000Z" });
    const newer = buildForum({ id: "newer", createdAt: "2026-06-01T00:00:00.000Z" });

    const sorted = sortForums([older, newer], "recent");
    expect(sorted[0].id).toBe("newer");
  });

  it("ordena por nome em ordem alfabética", () => {
    const beta = buildForum({ id: "b", name: "Beta" });
    const alpha = buildForum({ id: "a", name: "Alpha" });

    const sorted = sortForums([beta, alpha], "name");
    expect(sorted[0].id).toBe("a");
  });

  it("filtra salas com atividade online", () => {
    const active = buildForum({
      id: "active",
      participants: [{ id: "1", userId: "a", isOnline: true, user: undefined as never }],
    });
    const quiet = buildForum({ id: "quiet", participants: [] });

    const filtered = filterForumsByActivity([active, quiet], "online");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("active");
  });
});

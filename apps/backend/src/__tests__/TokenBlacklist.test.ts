const store = new Map<string, string>();

jest.mock("../config/redis", () => ({
  redisClient: {
    set: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve("OK");
    }),
    exists: jest.fn((key: string) => Promise.resolve(store.has(key) ? 1 : 0)),
  },
}));

import { tokenBlacklist } from "../utils/TokenBlacklist";

describe("TokenBlacklist (Redis mockado)", () => {
  beforeEach(() => store.clear());

  it("um jti não revogado retorna isRevoked = false", async () => {
    await expect(tokenBlacklist.isRevoked("jti-nunca-revogado")).resolves.toBe(false);
  });

  it("após revoke(), isRevoked passa a retornar true para aquele jti", async () => {
    await tokenBlacklist.revoke("jti-de-teste-123", 3600);
    await expect(tokenBlacklist.isRevoked("jti-de-teste-123")).resolves.toBe(true);
  });

  it("revogar um jti não afeta outros jtis", async () => {
    await tokenBlacklist.revoke("jti-A", 3600);
    await expect(tokenBlacklist.isRevoked("jti-A")).resolves.toBe(true);
    await expect(tokenBlacklist.isRevoked("jti-B")).resolves.toBe(false);
  });
});

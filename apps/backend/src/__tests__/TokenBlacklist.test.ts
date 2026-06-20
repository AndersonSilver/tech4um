import { tokenBlacklist } from "../utils/TokenBlacklist";

describe("TokenBlacklist", () => {
  it("um jti não revogado retorna isRevoked = false", () => {
    expect(tokenBlacklist.isRevoked("jti-nunca-revogado")).toBe(false);
  });

  it("após revoke(), isRevoked passa a retornar true para aquele jti", () => {
    tokenBlacklist.revoke("jti-de-teste-123");
    expect(tokenBlacklist.isRevoked("jti-de-teste-123")).toBe(true);
  });

  it("revogar um jti não afeta outros jtis", () => {
    tokenBlacklist.revoke("jti-A");
    expect(tokenBlacklist.isRevoked("jti-A")).toBe(true);
    expect(tokenBlacklist.isRevoked("jti-B")).toBe(false);
  });
});

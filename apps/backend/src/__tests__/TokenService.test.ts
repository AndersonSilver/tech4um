import { TokenService } from "../utils/TokenService";

describe("TokenService", () => {
  it("gera tokens com jti único a cada chamada", () => {
    const tokenA = TokenService.sign({ sub: "user-1", username: "lara" });
    const tokenB = TokenService.sign({ sub: "user-1", username: "lara" });

    const payloadA = TokenService.verify(tokenA);
    const payloadB = TokenService.verify(tokenB);

    expect(payloadA.jti).toBeDefined();
    expect(payloadB.jti).toBeDefined();
    expect(payloadA.jti).not.toBe(payloadB.jti);
  });

  it("verify lança erro para token malformado", () => {
    expect(() => TokenService.verify("token-invalido")).toThrow();
  });

  it("decodeUnsafe não lança erro mesmo para token expirado/inválido em formato", () => {
    const result = TokenService.decodeUnsafe("nao.e.um.jwt.valido");
    expect(result).toBeNull();
  });

  it("payload contém sub e username corretos", () => {
    const token = TokenService.sign({ sub: "user-42", username: "gustavo" });
    const payload = TokenService.verify(token);

    expect(payload.sub).toBe("user-42");
    expect(payload.username).toBe("gustavo");
  });
});

import { CryptoUtils } from "../utils/CryptoUtils";

describe("CryptoUtils", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = "chave_de_teste_com_mais_de_16_chars";
  });

  it("encrypt() produz um valor diferente do texto original", () => {
    const encrypted = CryptoUtils.encrypt("segredo-totp-base32");
    expect(encrypted).not.toBe("segredo-totp-base32");
    expect(encrypted.split(":")).toHaveLength(3);
  });

  it("decrypt(encrypt(x)) retorna o valor original", () => {
    const original = "JBSWY3DPEHPK3PXP";
    const encrypted = CryptoUtils.encrypt(original);
    expect(CryptoUtils.decrypt(encrypted)).toBe(original);
  });

  it("cada chamada de encrypt() usa um IV diferente (sem padrão repetido)", () => {
    const a = CryptoUtils.encrypt("mesmo-valor");
    const b = CryptoUtils.encrypt("mesmo-valor");
    expect(a).not.toBe(b);
  });
});

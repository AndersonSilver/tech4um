import { authenticator } from "otplib";
import { MfaService } from "../services/MfaService";
import { UserRepository } from "../repositories/UserRepository";
import { CryptoUtils } from "../utils/CryptoUtils";
import { User } from "../entities/User";

process.env.ENCRYPTION_KEY = "chave_de_teste_com_mais_de_16_chars";

function buildFakeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = "user-1";
  user.username = "lara";
  user.email = "lara@email.com";
  user.mfaEnabled = false;
  Object.assign(user, overrides);
  return user;
}

describe("MfaService", () => {
  function buildService(overrides: Partial<UserRepository> = {}) {
    const fakeRepository = {
      findById: jest.fn(),
      setPendingMfaSecret: jest.fn().mockResolvedValue(undefined),
      enableMfa: jest.fn().mockResolvedValue(undefined),
      disableMfa: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as unknown as UserRepository;

    return { service: new MfaService(fakeRepository), repository: fakeRepository };
  }

  it("setup() gera um QR code e retorna o secret em texto puro (para o usuário escanear)", async () => {
    const { service } = buildService();
    const result = await service.setup("user-1", "lara@email.com");

    expect(result.secret).toBeDefined();
    expect(result.qrCodeDataUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("enable() aceita um código TOTP válido gerado a partir do secret pendente", async () => {
    const secret = authenticator.generateSecret();
    const encrypted = CryptoUtils.encrypt(secret);
    const user = buildFakeUser({ mfaSecretEncrypted: encrypted });

    const { service, repository } = buildService({
      findById: jest.fn().mockResolvedValue(user),
    });

    const validCode = authenticator.generate(secret);
    await service.enable("user-1", validCode);

    expect(repository.enableMfa).toHaveBeenCalledWith("user-1");
  });

  it("enable() rejeita um código inválido", async () => {
    const secret = authenticator.generateSecret();
    const user = buildFakeUser({ mfaSecretEncrypted: CryptoUtils.encrypt(secret) });

    const { service } = buildService({ findById: jest.fn().mockResolvedValue(user) });

    await expect(service.enable("user-1", "000000")).rejects.toThrow("Código inválido");
  });

  it("verifyCode() retorna false se o usuário não tem MFA habilitado", async () => {
    const user = buildFakeUser({ mfaEnabled: false });
    const { service } = buildService({ findById: jest.fn().mockResolvedValue(user) });

    await expect(service.verifyCode("user-1", "123456")).resolves.toBe(false);
  });

  it("verifyCode() valida corretamente um código TOTP de uma conta com MFA habilitado", async () => {
    const secret = authenticator.generateSecret();
    const user = buildFakeUser({ mfaEnabled: true, mfaSecretEncrypted: CryptoUtils.encrypt(secret) });
    const { service } = buildService({ findById: jest.fn().mockResolvedValue(user) });

    const validCode = authenticator.generate(secret);
    await expect(service.verifyCode("user-1", validCode)).resolves.toBe(true);
  });

  it("disable() rejeita código inválido e não desabilita o MFA", async () => {
    const secret = authenticator.generateSecret();
    const user = buildFakeUser({ mfaEnabled: true, mfaSecretEncrypted: CryptoUtils.encrypt(secret) });
    const { service, repository } = buildService({ findById: jest.fn().mockResolvedValue(user) });

    await expect(service.disable("user-1", "000000")).rejects.toThrow("Código inválido");
    expect(repository.disableMfa).not.toHaveBeenCalled();
  });
});

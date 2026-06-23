import { AuthService } from "../services/AuthService";
import { UserRepository } from "../repositories/UserRepository";
import { User } from "../entities/User";

jest.mock("../services/EmailService", () => ({
  EmailService: { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock("../utils/GoogleTokenVerifier", () => ({
  GoogleTokenVerifier: {
    verifyAuthCode: jest.fn(),
  },
}));

jest.mock("../utils/imageUpload", () => ({
  saveImageFromDataUrl: jest.fn(),
  isValidUploadedImageUrl: jest.fn().mockReturnValue(true),
}));

import { GoogleTokenVerifier } from "../utils/GoogleTokenVerifier";
import { saveImageFromDataUrl } from "../utils/imageUpload";
import { EmailService } from "../services/EmailService";
import { PasswordHasher } from "../utils/PasswordHasher";
import { createHash } from "crypto";

function buildFakeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = "user-1";
  user.username = "lara";
  user.email = "lara@email.com";
  user.passwordHash = "$2b$10$hashedpasswordvalue1234567890123456789012";
  user.isEmailVerified = false;
  Object.assign(user, overrides);
  return user;
}

describe("AuthService", () => {
  function buildService(overrides: Partial<UserRepository> = {}) {
    const fakeRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      findByGoogleId: jest.fn(),
      linkGoogleAccount: jest.fn(),
      create: jest.fn(),
      updateProfile: jest.fn(),
      setEmailVerificationToken: jest.fn().mockResolvedValue(undefined),
      findByValidVerificationTokenHash: jest.fn(),
      markEmailVerified: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as unknown as UserRepository;

    return { service: new AuthService(fakeRepository), repository: fakeRepository };
  }

  it("não permite cadastro com e-mail já existente (mensagem genérica anti-enumeração)", async () => {
    const existingUser = buildFakeUser();
    const { service } = buildService({
      findByEmail: jest.fn().mockResolvedValue(existingUser),
    } as any);

    await expect(
      service.register({ username: "novo", email: "lara@email.com", password: "Senha123" })
    ).rejects.toThrow(/não foi possível concluir o cadastro/i);
  });

  it("não permite cadastro com username já existente", async () => {
    const { service } = buildService({
      findByEmail: jest.fn().mockResolvedValue(null),
      findByUsername: jest.fn().mockResolvedValue(buildFakeUser()),
    } as any);

    await expect(
      service.register({ username: "lara", email: "novo@email.com", password: "Senha123" })
    ).rejects.toThrow("Nome de usuário já em uso");
  });

  it("cadastra um novo usuário com sucesso e retorna token", async () => {
    const createdUser = buildFakeUser({ id: "user-2", email: "novo@email.com" });
    const { service } = buildService({
      findByEmail: jest.fn().mockResolvedValue(null),
      findByUsername: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(createdUser),
    } as any);

    const result = await service.register({
      username: "novo",
      email: "novo@email.com",
      password: "Senha123",
    });

    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("novo@email.com");
  });

  it("rejeita login com e-mail inexistente", async () => {
    const { service } = buildService({
      findByEmail: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(service.login({ email: "x@x.com", password: "Senha123" })).rejects.toThrow(
      "Credenciais inválidas"
    );
  });

  it("rejeita login de usuário cadastrado apenas via Google (sem senha)", async () => {
    const googleOnlyUser = buildFakeUser({ passwordHash: undefined });
    const { service } = buildService({
      findByEmail: jest.fn().mockResolvedValue(googleOnlyUser),
    } as any);

    await expect(
      service.login({ email: "lara@email.com", password: "qualquer" })
    ).rejects.toThrow("Credenciais inválidas");
  });

  it("verifyEmail() marca e-mail como verificado com token válido", async () => {
    const rawToken = "a".repeat(64);
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const user = buildFakeUser();

    const { service, repository } = buildService({
      findByValidVerificationTokenHash: jest.fn().mockResolvedValue(user),
    } as any);

    await service.verifyEmail(rawToken);

    expect(repository.findByValidVerificationTokenHash).toHaveBeenCalledWith(tokenHash);
    expect(repository.markEmailVerified).toHaveBeenCalledWith("user-1");
  });

  it("verifyEmail() rejeita token inválido ou expirado", async () => {
    const { service } = buildService({
      findByValidVerificationTokenHash: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(service.verifyEmail("token-invalido")).rejects.toThrow(
      "Link de verificação inválido ou expirado."
    );
  });

  it("resendVerificationEmail() não faz nada quando o e-mail já está verificado", async () => {
    const verifiedUser = buildFakeUser({ isEmailVerified: true });
    const { service, repository } = buildService({
      findByEmail: jest.fn().mockResolvedValue(verifiedUser),
    } as any);

    await service.resendVerificationEmail("lara@email.com");

    expect(repository.setEmailVerificationToken).not.toHaveBeenCalled();
    expect(EmailService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("getProfile() retorna 404 quando usuário não existe", async () => {
    const { service } = buildService({
      findById: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(service.getProfile("missing")).rejects.toThrow("Usuário não encontrado");
  });

  it("updateAvatar() aceita avatar pré-definido válido", async () => {
    const updated = buildFakeUser({ avatarUrl: "/api/avatars/blue-bot.svg" });
    const { service, repository } = buildService({
      updateProfile: jest.fn().mockResolvedValue(updated),
    } as any);

    const result = await service.updateAvatar("user-1", { presetId: "blue-bot" });

    expect(repository.updateProfile).toHaveBeenCalledWith("user-1", {
      avatarUrl: "/api/avatars/blue-bot.svg",
    });
    expect(result.avatarUrl).toBe("/api/avatars/blue-bot.svg");
  });

  it("updateAvatar() persiste upload via dataUrl", async () => {
    (saveImageFromDataUrl as jest.Mock).mockReturnValue("/api/uploads/avatar.png");
    const updated = buildFakeUser({ avatarUrl: "/api/uploads/avatar.png" });
    const { service, repository } = buildService({
      updateProfile: jest.fn().mockResolvedValue(updated),
    } as any);

    const result = await service.updateAvatar("user-1", {
      dataUrl: "data:image/png;base64,abc",
    });

    expect(saveImageFromDataUrl).toHaveBeenCalled();
    expect(repository.updateProfile).toHaveBeenCalled();
    expect(result.avatarUrl).toBe("/api/uploads/avatar.png");
  });

  it("loginWithGoogle() cria usuário novo quando não existe conta vinculada", async () => {
    (GoogleTokenVerifier.verifyAuthCode as jest.Mock).mockResolvedValue({
      googleId: "google-1",
      email: "novo@gmail.com",
      name: "Novo Usuário",
      avatarUrl: "https://lh3.googleusercontent.com/a/avatar",
    });

    const created = buildFakeUser({
      id: "user-google",
      email: "novo@gmail.com",
      username: "Novo Usuário",
      isEmailVerified: true,
    });

    const { service, repository } = buildService({
      findByGoogleId: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      findByUsername: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(created),
    } as any);

    const result = await service.loginWithGoogle("code", "http://localhost/callback");

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "novo@gmail.com",
        googleId: "google-1",
        isEmailVerified: true,
      })
    );
    expect(result.token).toBeDefined();
    expect(result.user.email).toBe("novo@gmail.com");
  });
});

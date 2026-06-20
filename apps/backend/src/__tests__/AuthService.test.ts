import { AuthService } from "../services/AuthService";
import { UserRepository } from "../repositories/UserRepository";
import { User } from "../entities/User";

jest.mock("../services/EmailService", () => ({
  EmailService: { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) },
}));

function buildFakeUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = "user-1";
  user.username = "lara";
  user.email = "lara@email.com";
  user.passwordHash = "$2b$10$hashedpasswordvalue1234567890123456789012";
  user.mfaEnabled = false;
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
});

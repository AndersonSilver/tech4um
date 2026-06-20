import { PasswordHasher } from "../utils/PasswordHasher";

describe("PasswordHasher", () => {
  it("gera um hash diferente do texto original", async () => {
    const hash = await PasswordHasher.hash("minhaSenha123");
    expect(hash).not.toBe("minhaSenha123");
  });

  it("confirma que a senha correta corresponde ao hash", async () => {
    const hash = await PasswordHasher.hash("minhaSenha123");
    await expect(PasswordHasher.compare("minhaSenha123", hash)).resolves.toBe(true);
  });

  it("rejeita uma senha incorreta", async () => {
    const hash = await PasswordHasher.hash("minhaSenha123");
    await expect(PasswordHasher.compare("senhaErrada", hash)).resolves.toBe(false);
  });
});

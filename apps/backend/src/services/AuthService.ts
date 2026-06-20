import { UserRepository } from "../repositories/UserRepository";
import { PasswordHasher } from "../utils/PasswordHasher";
import { TokenService } from "../utils/TokenService";
import { AppError } from "../utils/AppError";
import { GoogleTokenVerifier } from "../utils/GoogleTokenVerifier";
import type { RegisterRequestDTO, LoginRequestDTO, AuthResponseDTO } from "@tech4um/shared";

export class AuthService {
  constructor(private userRepository: UserRepository = new UserRepository()) {}

  async register(input: RegisterRequestDTO): Promise<AuthResponseDTO> {
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      // Mensagem deliberadamente genérica: não confirma se o e-mail já existe,
      // para evitar enumeração de contas (diferente do username, que é um
      // identificador público e portanto ok revelar).
      throw new AppError(
        "Não foi possível concluir o cadastro com os dados informados. Verifique o e-mail ou tente fazer login.",
        409
      );
    }

    const existingUsername = await this.userRepository.findByUsername(input.username);
    if (existingUsername) throw new AppError("Nome de usuário já em uso", 409);

    const passwordHash = await PasswordHasher.hash(input.password);

    const user = await this.userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
    });

    const token = TokenService.sign({ sub: user.id, username: user.username });

    return { user: user.toPublic(), token };
  }

  async login(input: LoginRequestDTO): Promise<AuthResponseDTO> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) throw new AppError("Credenciais inválidas", 401);

    const passwordMatches = await PasswordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new AppError("Credenciais inválidas", 401);

    const token = TokenService.sign({ sub: user.id, username: user.username });

    return { user: user.toPublic(), token };
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponseDTO> {
    const profile = await GoogleTokenVerifier.verify(idToken);

    let user = await this.userRepository.findByGoogleId(profile.googleId);

    if (!user) {
      // Se já existe conta com esse e-mail (criada via senha), vincula a conta ao Google
      const existingByEmail = await this.userRepository.findByEmail(profile.email);

      if (existingByEmail) {
        user = await this.userRepository.linkGoogleAccount(existingByEmail.id, profile.googleId, profile.avatarUrl);
      } else {
        const baseUsername = profile.email.split("@")[0];
        const username = await this.generateUniqueUsername(baseUsername);

        user = await this.userRepository.create({
          username,
          email: profile.email,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
        });
      }
    }

    const token = TokenService.sign({ sub: user.id, username: user.username });
    return { user: user.toPublic(), token };
  }

  private async generateUniqueUsername(base: string): Promise<string> {
    let candidate = base;
    let attempt = 0;

    while (await this.userRepository.findByUsername(candidate)) {
      attempt += 1;
      candidate = `${base}${attempt}`;
    }

    return candidate;
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("Usuário não encontrado", 404);
    return user.toPublic();
  }
}

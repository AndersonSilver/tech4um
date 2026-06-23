import { randomBytes, createHash } from "crypto";
import { UserRepository } from "../repositories/UserRepository";
import { PasswordHasher } from "../utils/PasswordHasher";
import { TokenService } from "../utils/TokenService";
import { AppError } from "../utils/AppError";
import { GoogleTokenVerifier } from "../utils/GoogleTokenVerifier";
import { EmailService } from "./EmailService";
import type {
  RegisterRequestDTO,
  LoginRequestDTO,
  AuthResponseDTO,
} from "@tech4um/shared";
import { User } from "../entities/User";
import type { GoogleProfile } from "../utils/GoogleTokenVerifier";
import { getPresetAvatarPath, isValidAvatarUrl } from "../utils/avatarValidation";
import { saveImageFromDataUrl } from "../utils/imageUpload";

const VERIFICATION_TOKEN_TTL_HOURS = 24;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  constructor(private userRepository: UserRepository = new UserRepository()) {}

  async register(input: Omit<RegisterRequestDTO, "captchaToken">): Promise<AuthResponseDTO> {
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

    await this.sendVerificationEmail(user.id, user.email);

    const token = TokenService.sign({ sub: user.id, username: user.username });

    return { user: user.toPublic(), token };
  }

  async login(input: Omit<LoginRequestDTO, "captchaToken">): Promise<AuthResponseDTO> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !user.passwordHash) throw new AppError("Credenciais inválidas", 401);

    const passwordMatches = await PasswordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) throw new AppError("Credenciais inválidas", 401);

    const token = TokenService.sign({ sub: user.id, username: user.username });
    return { user: user.toPublic(), token };
  }

  async loginWithGoogle(code: string, redirectUri: string): Promise<AuthResponseDTO> {
    const profile = await GoogleTokenVerifier.verifyAuthCode(code, redirectUri);

    let user = await this.userRepository.findByGoogleId(profile.googleId);

    if (!user) {
      const existingByEmail = await this.userRepository.findByEmail(profile.email);

      if (existingByEmail) {
        user = await this.userRepository.linkGoogleAccount(
          existingByEmail.id,
          profile.googleId,
          profile.avatarUrl
        );
        user = await this.syncGoogleProfile(user, profile);
      } else {
        const username = await this.resolveUniqueUsername(profile.name);

        user = await this.userRepository.create({
          username,
          email: profile.email,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          // E-mail já é verificado pelo próprio Google — não precisa do nosso fluxo.
          isEmailVerified: true,
        });
      }
    } else {
      user = await this.syncGoogleProfile(user, profile);
    }

    // Login via Google: a posse da conta Google já valida o acesso.
    const token = TokenService.sign({ sub: user.id, username: user.username });
    return { user: user.toPublic(), token };
  }

  // ---------- Verificação de e-mail ----------

  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await this.userRepository.setEmailVerificationToken(userId, tokenHash, expiresAt);

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${baseUrl}/verify-email?token=${rawToken}`;

    await EmailService.sendVerificationEmail(email, verificationUrl);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    // Resposta idêntica exista ou não o e-mail — evita enumeração de contas
    // também neste endpoint.
    if (!user || user.isEmailVerified) return;

    await this.sendVerificationEmail(user.id, user.email);
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const tokenHash = hashToken(rawToken);
    const user = await this.userRepository.findByValidVerificationTokenHash(tokenHash);

    if (!user) {
      throw new AppError("Link de verificação inválido ou expirado.", 400);
    }

    await this.userRepository.markEmailVerified(user.id);
  }

  private normalizeGoogleName(name: string): string {
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) return "Usuário";
    return trimmed.length > 30 ? trimmed.slice(0, 30) : trimmed;
  }

  private async syncGoogleProfile(user: User, profile: GoogleProfile): Promise<User> {
    const username = await this.resolveUniqueUsername(profile.name, user.id);
    return this.userRepository.updateProfile(user.id, {
      username,
      avatarUrl: profile.avatarUrl,
    });
  }

  private async resolveUniqueUsername(
    preferredName: string,
    excludeUserId?: string
  ): Promise<string> {
    const base = this.normalizeGoogleName(preferredName);
    let candidate = base;
    let attempt = 0;

    while (true) {
      const existing = await this.userRepository.findByUsername(candidate);
      if (!existing || existing.id === excludeUserId) {
        return candidate;
      }

      attempt += 1;
      const suffix = String(attempt);
      const maxBaseLen = Math.max(3, 30 - suffix.length);
      candidate = `${base.slice(0, maxBaseLen)}${suffix}`;
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("Usuário não encontrado", 404);
    return user.toPublic();
  }

  async updateAvatar(userId: string, input: { dataUrl?: string; presetId?: string }) {
    let avatarUrl: string;

    if (input.presetId) {
      const presetPath = getPresetAvatarPath(input.presetId);
      if (!presetPath || !isValidAvatarUrl(presetPath)) {
        throw new AppError("Avatar pré-definido inválido", 400);
      }
      avatarUrl = presetPath;
    } else if (input.dataUrl) {
      try {
        avatarUrl = saveImageFromDataUrl(input.dataUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha no upload";
        throw new AppError(message, 400);
      }
      if (!isValidAvatarUrl(avatarUrl)) {
        throw new AppError("Avatar enviado inválido", 400);
      }
    } else {
      throw new AppError("Informe uma foto ou um avatar", 400);
    }

    const user = await this.userRepository.updateProfile(userId, { avatarUrl });
    return user.toPublic();
  }
}

import { LessThan, MoreThan, Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

export class UserRepository {
  private repo: Repository<User> = AppDataSource.getRepository(User);

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByGoogleId(googleId: string) {
    return this.repo.findOne({ where: { googleId } });
  }

  async updateProfile(userId: string, data: { username?: string; avatarUrl?: string }) {
    await this.repo.update(userId, data);
    return this.repo.findOneOrFail({ where: { id: userId } });
  }

  async linkGoogleAccount(userId: string, googleId: string, avatarUrl?: string) {
    await this.repo.update(userId, { googleId, avatarUrl });
    return this.repo.findOneOrFail({ where: { id: userId } });
  }

  create(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  // ---------- Verificação de e-mail ----------

  async setEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date) {
    await this.repo.update(userId, {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    });
  }

  findByValidVerificationTokenHash(tokenHash: string) {
    return this.repo.findOne({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: MoreThan(new Date()),
      },
    });
  }

  async markEmailVerified(userId: string) {
    // IMPORTANTE: TypeORM's `update()` ignora chaves com valor `undefined`
    // (elas simplesmente não entram no SET da query) — para de fato limpar a
    // coluna no banco é necessário `null` explícito, não `undefined`.
    await this.repo.update(userId, {
      isEmailVerified: true,
      emailVerificationTokenHash: null as unknown as undefined,
      emailVerificationExpiresAt: null as unknown as undefined,
    });
  }

  // Reservado para uma futura rotina de limpeza (cron) de tokens de verificação
  // expirados — não é estritamente necessário hoje (o filtro por expiresAt já
  // impede reuso), mas evita acúmulo de lixo na coluna ao longo do tempo.
  findUsersWithExpiredVerificationTokens() {
    return this.repo.find({
      where: { emailVerificationExpiresAt: LessThan(new Date()) },
    });
  }
}

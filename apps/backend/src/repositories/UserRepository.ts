import { Repository } from "typeorm";
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
}

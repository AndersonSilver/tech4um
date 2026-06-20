import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export class PasswordHasher {
  static async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  }

  static async compare(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Forum } from "./Forum";
import { Message } from "./Message";
import { PublicUser } from "@tech4um/shared";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: "password_hash", nullable: true })
  passwordHash?: string;

  @Column({ name: "google_id", nullable: true, unique: true })
  googleId?: string;

  @Column({ name: "avatar_url", nullable: true })
  avatarUrl?: string;

  // ---------- Verificação de e-mail ----------
  @Column({ name: "is_email_verified", default: false })
  isEmailVerified!: boolean;

  // Armazenamos apenas o HASH do token de verificação (nunca o token em si),
  // mesma lógica de "nunca guardar segredo em texto puro" usada para senhas.
  @Column({ name: "email_verification_token_hash", nullable: true })
  emailVerificationTokenHash?: string;

  @Column({ name: "email_verification_expires_at", type: "timestamp", nullable: true })
  emailVerificationExpiresAt?: Date;

  // ---------- MFA (TOTP) ----------
  @Column({ name: "mfa_enabled", default: false })
  mfaEnabled!: boolean;

  // Segredo TOTP criptografado em repouso (AES-256-GCM) — nunca fica em texto puro no banco.
  @Column({ name: "mfa_secret_encrypted", nullable: true })
  mfaSecretEncrypted?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(() => Forum, (forum) => forum.owner)
  forums!: Forum[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages!: Message[];

  toPublic(): PublicUser {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      avatarUrl: this.avatarUrl,
      isEmailVerified: this.isEmailVerified,
      mfaEnabled: this.mfaEnabled,
    };
  }
}

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
      hasPassword: Boolean(this.passwordHash),
      hasGoogle: Boolean(this.googleId),
    };
  }
}

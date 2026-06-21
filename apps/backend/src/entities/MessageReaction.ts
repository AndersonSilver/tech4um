import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { Message } from "./Message";

@Entity("message_reactions")
@Unique(["messageId", "userId"])
export class MessageReaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "message_id" })
  messageId!: string;

  @ManyToOne(() => Message, (message) => message.reactions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "message_id" })
  message!: Message;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ length: 16 })
  emoji!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

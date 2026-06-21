import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Forum } from "./Forum";
import { MessageReaction } from "./MessageReaction";

export enum MessageType {
  PUBLIC = "public",
  PRIVATE = "private",
}

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "image_url", nullable: true })
  imageUrl?: string;

  @Column({ type: "enum", enum: MessageType, default: MessageType.PUBLIC })
  type!: MessageType;

  @Column({ name: "sender_id" })
  senderId!: string;

  @ManyToOne(() => User, (user) => user.sentMessages)
  @JoinColumn({ name: "sender_id" })
  sender!: User;

  @Column({ name: "recipient_id", nullable: true })
  recipientId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "recipient_id" })
  recipient?: User;

  @Column({ name: "forum_id" })
  forumId!: string;

  @ManyToOne(() => Forum, (forum) => forum.messages)
  @JoinColumn({ name: "forum_id" })
  forum!: Forum;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(() => MessageReaction, (reaction) => reaction.message)
  reactions?: MessageReaction[];

  isVisibleTo(userId: string): boolean {
    if (this.type === MessageType.PUBLIC) return true;
    return this.senderId === userId || this.recipientId === userId;
  }
}

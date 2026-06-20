import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Message } from "./Message";
import { ForumParticipant } from "./ForumParticipant";

@Entity("forums")
export class Forum {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: "owner_id" })
  ownerId!: string;

  @ManyToOne(() => User, (user) => user.forums)
  @JoinColumn({ name: "owner_id" })
  owner!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @OneToMany(() => Message, (message) => message.forum)
  messages!: Message[];

  @OneToMany(() => ForumParticipant, (participant) => participant.forum)
  participants!: ForumParticipant[];
}

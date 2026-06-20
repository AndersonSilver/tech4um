import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Forum } from "./Forum";

@Entity("forum_participants")
export class ForumParticipant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "forum_id" })
  forumId!: string;

  @ManyToOne(() => Forum, (forum) => forum.participants)
  @JoinColumn({ name: "forum_id" })
  forum!: Forum;

  @Column({ name: "is_online", default: false })
  isOnline!: boolean;

  @CreateDateColumn({ name: "joined_at" })
  joinedAt!: Date;
}

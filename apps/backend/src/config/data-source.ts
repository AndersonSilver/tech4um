import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Forum } from "../entities/Forum";
import { Message } from "../entities/Message";
import { ForumParticipant } from "../entities/ForumParticipant";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true, // usar apenas em desenvolvimento; em produção, usar migrations
  logging: false,
  entities: [User, Forum, Message, ForumParticipant],
  migrations: ["src/migrations/*.ts"],
});

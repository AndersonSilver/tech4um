import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Forum } from "../entities/Forum";
import { Message } from "../entities/Message";
import { MessageReaction } from "../entities/MessageReaction";
import { ForumParticipant } from "../entities/ForumParticipant";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // CRÍTICO: nunca usar synchronize=true em produção — pode alterar o schema
  // do banco de forma destrutiva e sem controle de versão. Em produção, usar
  // sempre `npm run migration:run`.
  synchronize:
    process.env.NODE_ENV !== "production" || process.env.TYPEORM_SYNC_ONCE === "true",
  logging: false,
  entities: [User, Forum, Message, ForumParticipant, MessageReaction],
  migrations: ["src/migrations/*.ts"],
});

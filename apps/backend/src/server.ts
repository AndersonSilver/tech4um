import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { AppDataSource } from "./config/data-source";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import { ChatSocketHandler } from "./sockets/ChatSocketHandler";
import { logger } from "./utils/logger";

dotenv.config();

async function bootstrap() {
  await AppDataSource.initialize();
  logger.info("📦 Conectado ao banco de dados");

  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api", routes);
  app.use(errorHandler);

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || "*" },
  });

  new ChatSocketHandler(io);

  const port = process.env.PORT || 3333;
  httpServer.listen(port, () => {
    logger.info(`🚀 Servidor rodando em http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  logger.error("Erro ao iniciar o servidor:", error);
  process.exit(1);
});

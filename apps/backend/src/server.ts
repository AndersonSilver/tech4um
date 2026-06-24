import "reflect-metadata";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { AppDataSource } from "./config/data-source";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";
import { generalRateLimiter } from "./middlewares/rateLimiters";
import { ChatSocketHandler } from "./sockets/ChatSocketHandler";
import { logger } from "./utils/logger";
import { getUploadsDirectory } from "./utils/imageUpload";
import { connectRedis } from "./config/redis";
import { seedDemoDataIfNeeded } from "./services/DemoDataSeeder";

const presetAvatarsDir = path.resolve(__dirname, "../assets/avatars");
dotenv.config();

function assertRequiredEnv() {
  const required = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`);
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.CORS_ORIGIN) {
      // Em produção, NUNCA aceitar CORS aberto (`*`) por padrão — é obrigatório
      // declarar explicitamente o(s) domínio(s) do frontend.
      throw new Error("CORS_ORIGIN é obrigatório em produção (não usar wildcard '*').");
    }
    if (!process.env.RECAPTCHA_SECRET_KEY) {
      throw new Error("RECAPTCHA_SECRET_KEY é obrigatório em produção (proteção de CAPTCHA).");
    }
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 16) {
    throw new Error("JWT_SECRET muito curto — use no mínimo 16 caracteres aleatórios.");
  }
}

async function bootstrap() {
  assertRequiredEnv();

  await AppDataSource.initialize();
  logger.info("📦 Conectado ao banco de dados");

  await connectRedis();

  await seedDemoDataIfNeeded(AppDataSource);

  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  // Helmet: cabeçalhos de segurança padrão (X-Content-Type-Options, HSTS quando
  // servido via HTTPS, remoção de X-Powered-By, etc.)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true, // necessário para o cookie httpOnly de autenticação
    })
  );

  app.use(cookieParser());
  // Base64 de imagem (até 10MB) ocupa ~13,5MB no JSON — margem para o payload completo.
  app.use(express.json({ limit: "16mb" }));
  app.use(requestLogger);
  app.use(generalRateLimiter);

  app.use("/api/uploads", express.static(getUploadsDirectory()));
  app.use("/api/avatars", express.static(presetAvatarsDir));
  app.use("/api", routes);
  app.use(errorHandler);

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
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

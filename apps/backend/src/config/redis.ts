import Redis from "ioredis";
import { logger } from "../utils/logger";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redisClient.on("error", (err) => {
  logger.error("Erro de conexão com o Redis", { message: err.message });
});

redisClient.on("connect", () => {
  logger.info("🔴 Conectado ao Redis");
});

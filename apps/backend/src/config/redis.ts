import Redis from "ioredis";
import { logger } from "../utils/logger";

const isTest = process.env.NODE_ENV === "test";
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: isTest ? null : 3,
  lazyConnect: true,
  enableOfflineQueue: !isTest,
  ...(isTest ? { retryStrategy: () => null } : {}),
});

if (!isTest) {
  redisClient.on("error", (err) => {
    logger.error("Erro de conexão com o Redis", { message: err.message });
  });

  redisClient.on("connect", () => {
    logger.info("🔴 Conectado ao Redis");
  });
}

export async function connectRedis(): Promise<void> {
  if (isTest) return;

  if (redisClient.status === "wait" || redisClient.status === "close") {
    await redisClient.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient.status === "end") return;

  await redisClient.quit().catch(() => {
    redisClient.disconnect();
  });
}

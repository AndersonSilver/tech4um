import { redisClient } from "../config/redis";
import { logger } from "./logger";

const KEY_PREFIX = "tech4um:blacklist:";

class TokenBlacklist {
  /**
   * @param jti identificador único do token
   * @param ttlSeconds tempo restante até a expiração natural do token —
   *   depois disso o token já seria inválido por expiração mesmo sem blacklist,
   *   então não há necessidade de manter a entrada além desse prazo.
   */
  async revoke(jti: string, ttlSeconds: number): Promise<void> {
    try {
      const safeTtl = Math.max(ttlSeconds, 1);
      await redisClient.set(`${KEY_PREFIX}${jti}`, "1", "EX", safeTtl);
    } catch (error) {
      logger.error("Falha ao revogar token no Redis", { jti, error: (error as Error).message });
    }
  }

  async isRevoked(jti: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(`${KEY_PREFIX}${jti}`);
      return result === 1;
    } catch (error) {
      logger.error("Falha ao consultar blacklist no Redis", {
        jti,
        error: (error as Error).message,
      });
      return false;
    }
  }
}

export const tokenBlacklist = new TokenBlacklist();

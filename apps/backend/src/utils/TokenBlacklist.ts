import { redisClient } from "../config/redis";
import { logger } from "./logger";

const KEY_PREFIX = "tech4um:blacklist:";

/**
 * Blacklist de tokens revogados (por `jti`), agora persistida no Redis —
 * compartilhada entre todas as instâncias do backend (corrige a limitação
 * da versão em memória, que não se propagava em deploys com múltiplas réplicas).
 *
 * A chave expira automaticamente (TTL) junto com o tempo de vida restante do
 * token, então a blacklist nunca cresce indefinidamente.
 */
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
      // Falha ao revogar não deve travar a requisição de logout do usuário,
      // mas precisa ficar visível nos logs — é uma falha de segurança silenciosa.
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
      // Fail-closed seria mais seguro, mas derrubaria toda a aplicação se o Redis
      // cair. Optamos por fail-open com log de erro visível — trade-off documentado.
      return false;
    }
  }
}

export const tokenBlacklist = new TokenBlacklist();

/**
 * Blacklist de tokens revogados (por `jti`), mantida em memória.
 *
 * LIMITAÇÃO CONHECIDA: por estar em memória, a blacklist é por instância do
 * processo — em um deploy com múltiplas réplicas, um logout em uma instância
 * não invalida o token nas outras. Para produção multi-instância, trocar por
 * um armazenamento compartilhado (ex.: Redis com TTL = tempo restante do token).
 * Documentado aqui propositalmente para não dar falsa sensação de segurança.
 */
class TokenBlacklist {
  private revoked = new Set<string>();

  revoke(jti: string) {
    this.revoked.add(jti);
  }

  isRevoked(jti: string): boolean {
    return this.revoked.has(jti);
  }
}

export const tokenBlacklist = new TokenBlacklist();

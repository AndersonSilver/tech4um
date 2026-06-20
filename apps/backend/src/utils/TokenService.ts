import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

export interface TokenPayload {
  sub: string; // user id
  username: string;
  jti: string; // identificador único do token (necessário para revogação/blacklist)
  exp?: number; // timestamp unix de expiração (preenchido automaticamente pelo jwt)
}

export interface MfaPendingPayload {
  sub: string;
  type: "mfa_pending";
  exp?: number;
}

export class TokenService {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 16) {
      // Falha rápida: nunca rodar com segredo ausente/fraco, especialmente em produção.
      throw new Error(
        "JWT_SECRET não configurado ou muito curto (mínimo 16 caracteres). Configure a variável de ambiente antes de iniciar o servidor."
      );
    }
    return secret;
  }

  private static expiresIn = process.env.JWT_EXPIRES_IN || "2h";

  static sign(payload: Omit<TokenPayload, "jti">): string {
    const jti = randomUUID();
    return jwt.sign({ ...payload, jti }, this.getSecret(), {
      expiresIn: this.expiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  static verify(token: string): TokenPayload {
    return jwt.verify(token, this.getSecret()) as TokenPayload;
  }

  /** Segundos restantes até a expiração do token, a partir de um payload já verificado. */
  static remainingSeconds(payload: TokenPayload): number {
    if (!payload.exp) return 0;
    return Math.max(payload.exp - Math.floor(Date.now() / 1000), 0);
  }

  /**
   * Decodifica o token SEM verificar assinatura/expiração.
   * Usado apenas para checagens não-críticas (ex.: revalidação periódica de socket
   * para decidir quando vale a pena chamar `verify` novamente). Nunca usar o resultado
   * deste método para decisões de autorização.
   */
  static decodeUnsafe(token: string): TokenPayload | null {
    const decoded = jwt.decode(token);
    return (decoded as TokenPayload) ?? null;
  }

  /**
   * Token de curtíssima duração (5 min) emitido após senha correta quando a
   * conta tem MFA habilitado. Tem um `type` próprio para que nunca possa ser
   * confundido/aceito como um token de sessão completo pelo `authMiddleware`.
   */
  static signMfaPending(userId: string): string {
    return jwt.sign({ sub: userId, type: "mfa_pending" }, this.getSecret(), {
      expiresIn: "5m",
    });
  }

  static verifyMfaPending(token: string): MfaPendingPayload {
    const payload = jwt.verify(token, this.getSecret()) as MfaPendingPayload;
    if (payload.type !== "mfa_pending") {
      throw new Error("Token não é um token de MFA pendente válido.");
    }
    return payload;
  }
}

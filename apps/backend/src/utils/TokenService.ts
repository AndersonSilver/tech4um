import jwt from "jsonwebtoken";

export interface TokenPayload {
  sub: string; // user id
  username: string;
}

export class TokenService {
  private static secret = process.env.JWT_SECRET || "dev_secret";
  private static expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  static sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  static verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}

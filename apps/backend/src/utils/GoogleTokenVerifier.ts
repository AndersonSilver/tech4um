import { OAuth2Client } from "google-auth-library";
import { AppError } from "./AppError";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

function createOAuthClient(redirectUri?: string) {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

export class GoogleTokenVerifier {
  static async verifyAuthCode(code: string, redirectUri: string): Promise<GoogleProfile> {
    const client = createOAuthClient(redirectUri);

    try {
      const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });
      if (!tokens.id_token) {
        throw new AppError("Token do Google inválido", 401);
      }
      return this.profileFromIdToken(tokens.id_token, client);
    } catch {
      throw new AppError("Código de autorização do Google inválido ou expirado", 401);
    }
  }

  static async verify(idToken: string): Promise<GoogleProfile> {
    return this.profileFromIdToken(idToken, createOAuthClient());
  }

  private static async profileFromIdToken(
    idToken: string,
    client: OAuth2Client
  ): Promise<GoogleProfile> {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new AppError("Token do Google inválido", 401);
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name:
        payload.name ||
        [payload.given_name, payload.family_name].filter(Boolean).join(" ") ||
        payload.email.split("@")[0],
      avatarUrl: payload.picture,
    };
  }
}

import { OAuth2Client } from "google-auth-library";
import { AppError } from "./AppError";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export class GoogleTokenVerifier {
  static async verify(idToken: string): Promise<GoogleProfile> {
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
      name: payload.name || payload.email.split("@")[0],
      avatarUrl: payload.picture,
    };
  }
}

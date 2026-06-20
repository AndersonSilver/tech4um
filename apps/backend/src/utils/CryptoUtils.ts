import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

/**
 * Criptografa/descriptografa valores sensíveis antes de persistir no banco
 * (hoje usado para o segredo TOTP do MFA). Mesmo que o banco seja comprometido
 * via SQL injection ou um dump de backup vaze, o segredo não fica em texto puro.
 *
 * Usa AES-256-GCM (autenticado) com `ENCRYPTION_KEY` derivada via SHA-256
 * (assim aceitamos qualquer string como chave, sem exigir exatamente 32 bytes).
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) {
    throw new Error(
      "ENCRYPTION_KEY não configurada ou muito curta (mínimo 16 caracteres) — necessária para criptografar segredos de MFA."
    );
  }
  return createHash("sha256").update(secret).digest();
}

export class CryptoUtils {
  static encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // formato: iv:authTag:ciphertext (tudo em base64)
    return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
  }

  static decrypt(payload: string): string {
    const [ivB64, authTagB64, dataB64] = payload.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const data = Buffer.from(dataB64, "base64");

    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  }
}

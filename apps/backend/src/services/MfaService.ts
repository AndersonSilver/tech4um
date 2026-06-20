import { authenticator } from "otplib";
import QRCode from "qrcode";
import { UserRepository } from "../repositories/UserRepository";
import { CryptoUtils } from "../utils/CryptoUtils";
import { AppError } from "../utils/AppError";
import { MfaSetupResponseDTO } from "@tech4um/shared";

const ISSUER = "Tech4um";

export class MfaService {
  constructor(private userRepository: UserRepository = new UserRepository()) {}

  /**
   * Gera um novo segredo TOTP e devolve o QR code para escanear no app
   * autenticador (Google Authenticator, Authy, 1Password, etc.). O segredo
   * fica "pendente" (criptografado, mas mfaEnabled ainda false) até o usuário
   * confirmar com um código válido em `enable()` — evita habilitar MFA sem o
   * usuário ter realmente configurado o app corretamente.
   */
  async setup(userId: string, userEmail: string): Promise<MfaSetupResponseDTO> {
    const secret = authenticator.generateSecret();
    const encrypted = CryptoUtils.encrypt(secret);

    await this.userRepository.setPendingMfaSecret(userId, encrypted);

    const otpauthUrl = authenticator.keyuri(userEmail, ISSUER, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { qrCodeDataUrl, secret };
  }

  async enable(userId: string, code: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user?.mfaSecretEncrypted) {
      throw new AppError("Nenhuma configuração de MFA pendente. Inicie o setup novamente.", 400);
    }

    const secret = CryptoUtils.decrypt(user.mfaSecretEncrypted);
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) throw new AppError("Código inválido.", 400);

    await this.userRepository.enableMfa(userId);
  }

  async disable(userId: string, code: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user?.mfaEnabled || !user.mfaSecretEncrypted) {
      throw new AppError("MFA não está habilitado para esta conta.", 400);
    }

    const secret = CryptoUtils.decrypt(user.mfaSecretEncrypted);
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) throw new AppError("Código inválido.", 400);

    await this.userRepository.disableMfa(userId);
  }

  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user?.mfaEnabled || !user.mfaSecretEncrypted) return false;

    const secret = CryptoUtils.decrypt(user.mfaSecretEncrypted);
    return authenticator.verify({ token: code, secret });
  }
}

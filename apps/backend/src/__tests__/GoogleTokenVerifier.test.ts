import { OAuth2Client } from "google-auth-library";
import { GoogleTokenVerifier } from "../utils/GoogleTokenVerifier";
import { AppError } from "../utils/AppError";

jest.mock("google-auth-library");

describe("GoogleTokenVerifier", () => {
  const mockVerifyIdToken = jest.fn();
  const mockGetToken = jest.fn();

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";

    (OAuth2Client as unknown as jest.Mock).mockImplementation(() => ({
      getToken: mockGetToken,
      verifyIdToken: mockVerifyIdToken,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("verify extrai perfil do id_token", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-1",
        email: "user@email.com",
        name: "User Test",
        picture: "https://avatar.url",
      }),
    });

    const profile = await GoogleTokenVerifier.verify("id-token");

    expect(profile).toEqual({
      googleId: "google-1",
      email: "user@email.com",
      name: "User Test",
      avatarUrl: "https://avatar.url",
    });
  });

  it("verify lança AppError quando payload é inválido", async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => null });

    await expect(GoogleTokenVerifier.verify("bad-token")).rejects.toThrow(AppError);
  });

  it("verifyAuthCode troca code por perfil", async () => {
    mockGetToken.mockResolvedValue({ tokens: { id_token: "id-from-code" } });
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-2",
        email: "other@email.com",
        given_name: "Ana",
        family_name: "Silva",
      }),
    });

    const profile = await GoogleTokenVerifier.verifyAuthCode("auth-code", "http://localhost/cb");

    expect(mockGetToken).toHaveBeenCalledWith({
      code: "auth-code",
      redirect_uri: "http://localhost/cb",
    });
    expect(profile.googleId).toBe("google-2");
    expect(profile.name).toBe("Ana Silva");
  });

  it("verifyAuthCode lança AppError quando getToken falha", async () => {
    mockGetToken.mockRejectedValue(new Error("invalid_grant"));

    await expect(
      GoogleTokenVerifier.verifyAuthCode("bad-code", "http://localhost/cb")
    ).rejects.toThrow("Código de autorização do Google inválido ou expirado");
  });

  it("normaliza foto do Google com sufixo de tamanho estável", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-3",
        email: "pic@email.com",
        name: "Pic User",
        picture: "https://lh3.googleusercontent.com/a/abcd",
      }),
    });

    const profile = await GoogleTokenVerifier.verify("id-token");

    expect(profile.avatarUrl).toBe("https://lh3.googleusercontent.com/a/abcd=s96-c");
  });
});

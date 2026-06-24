import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

function AuthProbe() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>loading</div>;
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="username">{user?.username ?? "none"}</span>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restaura sessão via /auth/me ao montar", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { id: "1", username: "lara", email: "l@x.com", isEmailVerified: true },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("yes"));
    expect(screen.getByTestId("username")).toHaveTextContent("lara");
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });

  it("define user null quando /auth/me falha", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("unauthorized"));

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId("auth")).toHaveTextContent("no"));
  });

  it("login atualiza usuário com resposta da API", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: null });

    let authApi: ReturnType<typeof useAuth> | null = null;

    function LoginProbe() {
      authApi = useAuth();
      return null;
    }

    render(
      <AuthProvider>
        <LoginProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(authApi).not.toBeNull());

    vi.mocked(api.post).mockResolvedValue({
      data: { user: { id: "2", username: "joao", email: "j@x.com", isEmailVerified: false } },
    });

    await act(async () => {
      await authApi!.login("j@x.com", "Senha123", "captcha");
    });

    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "j@x.com",
      password: "Senha123",
      captchaToken: "captcha",
    });
    expect(authApi!.user?.username).toBe("joao");
  });
});

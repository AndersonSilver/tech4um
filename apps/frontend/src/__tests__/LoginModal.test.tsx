import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginModal } from "../components/LoginModal";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/recaptcha", () => ({
  executeRecaptcha: vi.fn().mockResolvedValue("captcha-token"),
}));

vi.mock("../components/GoogleLoginButton", () => ({
  GoogleLoginButton: () => <div>google-login-mock</div>,
}));

import { useAuth } from "../context/AuthContext";

describe("LoginModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("renderiza aba de login por padrão", () => {
    render(<LoginModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText("Que bom ter você aqui!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("alterna para cadastro", () => {
    render(<LoginModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Cadastro" }));
    expect(screen.getByText("Vamos criar sua conta!")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Seu nome de usuário")).toBeInTheDocument();
  });

  it("faz login com sucesso", async () => {
    const onSuccess = vi.fn();
    const login = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({ login, register: vi.fn() } as unknown as ReturnType<typeof useAuth>);

    render(<LoginModal onClose={vi.fn()} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText("seuemail@email.com"), {
      target: { value: "lara@email.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Senha123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(login).toHaveBeenCalled());
    expect(onSuccess).toHaveBeenCalled();
  });
});

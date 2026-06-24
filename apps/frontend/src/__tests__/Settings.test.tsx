import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Settings } from "../pages/Settings";

vi.mock("../components/Header", () => ({ Header: () => <div>header</div> }));
vi.mock("../components/ProfileAvatarEditor", () => ({
  ProfileAvatarEditor: () => <div>avatar-editor</div>,
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../services/api", () => ({ api: { post: vi.fn() } }));

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redireciona usuário não autenticado", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("exibe dados do usuário autenticado", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        username: "Lara",
        email: "lara@email.com",
        isEmailVerified: true,
      },
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    expect(screen.getByText("Configurações da conta")).toBeInTheDocument();
    expect(screen.getByText("Lara")).toBeInTheDocument();
    expect(screen.getByText("avatar-editor")).toBeInTheDocument();
  });

  it("reenvia e-mail de verificação para conta pendente", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        username: "Lara",
        email: "lara@email.com",
        isEmailVerified: false,
      },
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reenviar e-mail de verificação" }));

    await waitFor(() =>
      expect(screen.getByText(/Enviamos um novo link de verificação/)).toBeInTheDocument()
    );
    expect(api.post).toHaveBeenCalledWith("/auth/resend-verification", {
      email: "lara@email.com",
    });
  });
});

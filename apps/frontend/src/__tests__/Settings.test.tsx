import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Settings } from "../pages/Settings";

vi.mock("../components/Header", () => ({ Header: () => <div>header</div> }));
vi.mock("../components/ProfileAvatarEditor", () => ({
  ProfileAvatarEditor: () => <div>avatar-editor</div>,
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));

import { useAuth } from "../context/AuthContext";

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
    expect(screen.getByText("Perfil no chat")).toBeInTheDocument();
    expect(screen.getByText("avatar-editor")).toBeInTheDocument();
    expect(screen.getByText("E-mail")).toBeInTheDocument();
    expect(screen.getByText("lara@email.com")).toBeInTheDocument();
  });
});

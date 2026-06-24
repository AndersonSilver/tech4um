import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Header } from "../components/Header";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../context/AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Header", () => {
  it("exibe botão de login quando não autenticado", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    const onLoginClick = vi.fn();
    render(
      <MemoryRouter>
        <Header onLoginClick={onLoginClick} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText("Fazer login"));
    expect(onLoginClick).toHaveBeenCalled();
  });

  it("exibe menu do usuário autenticado", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "1",
        username: "Lara",
        email: "lara@email.com",
        isEmailVerified: true,
      },
      isAuthenticated: true,
      logout,
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText("Lara")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Menu do usuário"));
    fireEvent.click(screen.getByText("Sair"));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

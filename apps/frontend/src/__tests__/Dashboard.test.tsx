import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "../pages/Dashboard";

vi.mock("../components/Header", () => ({
  Header: ({ onLoginClick }: { onLoginClick?: () => void }) => (
    <button type="button" onClick={onLoginClick}>
      header-login
    </button>
  ),
}));
vi.mock("../components/LoginModal", () => ({
  LoginModal: ({ onClose }: { onClose: () => void }) => (
    <div>
      login-modal<button onClick={onClose}>close-login</button>
    </div>
  ),
}));
vi.mock("../components/CreateForumModal", () => ({
  CreateForumModal: () => <div>create-modal</div>,
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../context/SocketContext", () => ({ useSocket: vi.fn(() => null) }));
vi.mock("../services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as ReturnType<typeof useAuth>);
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: "f1",
          name: "Cloud",
          ownerId: "o1",
          createdAt: new Date().toISOString(),
          participants: [],
        },
      ],
    });
  });

  it("carrega e exibe fóruns", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Cloud")).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith("/forums");
  });

  it("abre modal de login quando ação exige autenticação", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Cloud")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /crie seu próprio 4um/i }));
    expect(screen.getByText("login-modal")).toBeInTheDocument();
  });
});

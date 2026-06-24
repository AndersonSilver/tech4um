import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { VerifyEmail } from "../pages/VerifyEmail";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("VerifyEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe erro quando token está ausente", async () => {
    render(
      <MemoryRouter initialEntries={["/verify-email"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("Link de verificação inválido.")).toBeInTheDocument()
    );
  });

  it("verifica e-mail com sucesso", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {} });

    render(
      <MemoryRouter initialEntries={["/verify-email?token=abc"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText("E-mail verificado com sucesso!")).toBeInTheDocument()
    );
    expect(api.get).toHaveBeenCalledWith("/auth/verify-email", { params: { token: "abc" } });
  });

  it("exibe erro quando verificação falha", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("expired"));

    render(
      <MemoryRouter initialEntries={["/verify-email?token=expired"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/Não foi possível verificar seu e-mail/)).toBeInTheDocument()
    );
  });
});

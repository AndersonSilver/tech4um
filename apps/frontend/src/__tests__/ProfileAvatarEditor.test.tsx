import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileAvatarEditor } from "../components/ProfileAvatarEditor";

const refreshUser = vi.fn().mockResolvedValue(undefined);
const apiPatch = vi.fn().mockResolvedValue({});

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ refreshUser }),
}));

vi.mock("../services/api", () => ({
  api: {
    patch: (...args: unknown[]) => apiPatch(...args),
  },
}));

describe("ProfileAvatarEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe o username e a pré-visualização", () => {
    render(<ProfileAvatarEditor username="Lara" avatarUrl="/api/avatars/blue-bot.svg" />);

    expect(screen.getByText("Lara")).toBeInTheDocument();
    expect(screen.getByText("Pré-visualização do seu perfil no chat.")).toBeInTheDocument();
  });

  it("alterna para o modo de upload de foto", () => {
    render(<ProfileAvatarEditor username="Lara" />);

    fireEvent.click(screen.getByRole("button", { name: "Enviar foto" }));

    expect(screen.getByText("Envie uma foto JPG, PNG, GIF ou WebP de até 10MB.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selecionar imagem" })).toBeInTheDocument();
  });

  it("salva avatar pré-definido selecionado", async () => {
    render(<ProfileAvatarEditor username="Lara" />);

    fireEvent.click(screen.getByRole("button", { name: "Robô azul" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar avatar" }));

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledWith("/auth/profile/avatar", { presetId: "blue-bot" });
    });

    expect(refreshUser).toHaveBeenCalled();
    expect(screen.getByText("Avatar atualizado.")).toBeInTheDocument();
  });

  it("rejeita arquivo que não é imagem", () => {
    render(<ProfileAvatarEditor username="Lara" />);

    fireEvent.click(screen.getByRole("button", { name: "Enviar foto" }));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["conteudo"], "doc.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("Selecione um arquivo de imagem válido.")).toBeInTheDocument();
  });

  it("rejeita imagem maior que 10MB", () => {
    render(<ProfileAvatarEditor username="Lara" />);

    fireEvent.click(screen.getByRole("button", { name: "Enviar foto" }));

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["conteudo"], "grande.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("A imagem deve ter no máximo 10MB.")).toBeInTheDocument();
  });
});

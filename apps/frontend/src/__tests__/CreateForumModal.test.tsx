import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateForumModal } from "../components/CreateForumModal";

describe("CreateForumModal", () => {
  it("cria fórum e fecha ao sucesso", async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<CreateForumModal onCreate={onCreate} onClose={onClose} />);

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "Novo 4um" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith("Novo 4um", undefined));
    expect(onClose).toHaveBeenCalled();
  });

  it("exibe erro quando criação falha", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("duplicate"));

    render(<CreateForumModal onCreate={onCreate} onClose={vi.fn()} />);

    fireEvent.change(screen.getAllByRole("textbox")[0], {
      target: { value: "Duplicado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() =>
      expect(screen.getByText(/Não foi possível criar o fórum/)).toBeInTheDocument()
    );
  });

  it("chama onClose ao cancelar", () => {
    const onClose = vi.fn();
    render(<CreateForumModal onCreate={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
  });
});

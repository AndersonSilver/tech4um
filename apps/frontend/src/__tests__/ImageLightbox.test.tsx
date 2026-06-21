import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageLightbox } from "../components/ImageLightbox";

describe("ImageLightbox", () => {
  it("exibe a imagem ampliada", () => {
    render(
      <ImageLightbox
        src="http://localhost/api/uploads/foto.png"
        alt="Foto do chat"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: "Visualização ampliada da imagem" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Foto do chat" })).toBeInTheDocument();
  });

  it("chama onClose ao clicar no botão fechar", () => {
    const onClose = vi.fn();
    render(<ImageLightbox src="/foto.png" alt="Foto" onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Fechar imagem" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("chama onClose ao clicar no fundo escuro", () => {
    const onClose = vi.fn();
    render(<ImageLightbox src="/foto.png" alt="Foto" onClose={onClose} />);

    fireEvent.click(screen.getByRole("dialog", { name: "Visualização ampliada da imagem" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao pressionar Escape", () => {
    const onClose = vi.fn();
    render(<ImageLightbox src="/foto.png" alt="Foto" onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("bloqueia scroll do body enquanto aberto", () => {
    const { unmount } = render(<ImageLightbox src="/foto.png" alt="Foto" onClose={vi.fn()} />);

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });
});

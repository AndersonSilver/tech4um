import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatMessageComposer, resolveMessageImageUrl } from "../components/ChatMessageComposer";

vi.mock("../components/EmojiPicker", () => ({
  EmojiPicker: ({ onSelect }: { onSelect: (emoji: string) => void }) => (
    <button type="button" onClick={() => onSelect("😀")}>
      pick-emoji
    </button>
  ),
}));

describe("ChatMessageComposer", () => {
  const baseProps = {
    content: "",
    isPrivateMode: false,
    pendingImageUrl: null,
    isUploading: false,
    onContentChange: vi.fn(),
    onTyping: vi.fn(),
    onSend: vi.fn(),
    onCancelPrivate: vi.fn(),
    onImageSelected: vi.fn(),
    onRemovePendingImage: vi.fn(),
  };

  it("exibe destino público por padrão", () => {
    render(<ChatMessageComposer {...baseProps} />);
    expect(screen.getByText("Enviando para todos do 4um")).toBeInTheDocument();
  });

  it("exibe destino privado e botão de cancelar", () => {
    render(
      <ChatMessageComposer {...baseProps} isPrivateMode recipientName="Ana" />
    );
    expect(screen.getByText("Enviando para Ana")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancelar mensagem privada"));
    expect(baseProps.onCancelPrivate).toHaveBeenCalled();
  });

  it("envia mensagem ao pressionar Enter", () => {
    render(<ChatMessageComposer {...baseProps} content="oi" />);
    fireEvent.keyDown(screen.getByPlaceholderText(/Escreva aqui/), { key: "Enter" });
    expect(baseProps.onSend).toHaveBeenCalled();
  });

  it("rejeita imagem maior que 10MB", () => {
    const onImageRejected = vi.fn();
    render(<ChatMessageComposer {...baseProps} onImageRejected={onImageRejected} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(bigFile, "size", { value: 11 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(onImageRejected).toHaveBeenCalledWith("A imagem deve ter no máximo 10MB.");
  });
});

describe("resolveMessageImageUrl", () => {
  it("retorna null sem imageUrl", () => {
    expect(resolveMessageImageUrl()).toBeNull();
  });

  it("prefixa origin para paths relativos", () => {
    const url = resolveMessageImageUrl("/api/uploads/test.png");
    expect(url).toContain("/api/uploads/test.png");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmojiPicker } from "../components/EmojiPicker";
import { EMOJI_CATEGORIES, RECENT_EMOJIS_KEY } from "../data/chatEmojis";

describe("EmojiPicker", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renderiza o seletor de emojis", () => {
    render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "Seletor de emojis" })).toBeInTheDocument();
  });

  it("chama onSelect ao clicar em um emoji da categoria padrão", () => {
    const onSelect = vi.fn();
    render(<EmojiPicker onSelect={onSelect} onClose={vi.fn()} />);

    const firstEmoji = EMOJI_CATEGORIES[0].emojis[0];
    fireEvent.click(screen.getByRole("button", { name: `Inserir emoji ${firstEmoji}` }));

    expect(onSelect).toHaveBeenCalledWith(firstEmoji);
  });

  it("chama onClose ao pressionar Escape", () => {
    const onClose = vi.fn();
    render(<EmojiPicker onSelect={vi.fn()} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao clicar fora do picker", () => {
    const onClose = vi.fn();
    render(<EmojiPicker onSelect={vi.fn()} onClose={onClose} />);

    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("exibe emojis recentes quando existem no localStorage", () => {
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(["🚀"]));

    render(<EmojiPicker onSelect={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Inserir emoji 🚀" })).toBeInTheDocument();
  });
});

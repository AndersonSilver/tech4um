import { createRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmojiPicker } from "../components/EmojiPicker";
import { EMOJI_CATEGORIES, RECENT_EMOJIS_KEY } from "../data/chatEmojis";

function mockAnchorRect() {
  return {
    top: 400,
    left: 200,
    right: 240,
    bottom: 440,
    width: 40,
    height: 40,
    x: 200,
    y: 400,
    toJSON: () => ({}),
  } as DOMRect;
}

function renderPicker(props: {
  onSelect?: (emoji: string) => void;
  onClose?: () => void;
}) {
  const anchorRef = createRef<HTMLButtonElement>();

  function Harness() {
    return (
      <>
        <button ref={anchorRef} type="button">
          Emoji
        </button>
        <EmojiPicker
          anchorRef={anchorRef}
          onSelect={props.onSelect ?? vi.fn()}
          onClose={props.onClose ?? vi.fn()}
        />
      </>
    );
  }

  const view = render(<Harness />);

  return { anchorRef, ...view };
}

describe("EmojiPicker", () => {
  beforeEach(() => {
    localStorage.clear();
    Element.prototype.getBoundingClientRect = () => mockAnchorRect();
  });

  it("renderiza o seletor de emojis", () => {
    renderPicker({});
    expect(screen.getByRole("dialog", { name: "Seletor de emojis" })).toBeInTheDocument();
  });

  it("chama onSelect ao clicar em um emoji da categoria padrão", () => {
    const onSelect = vi.fn();
    renderPicker({ onSelect });

    const firstEmoji = EMOJI_CATEGORIES[0].emojis[0];
    fireEvent.click(screen.getByRole("button", { name: `Inserir emoji ${firstEmoji}` }));

    expect(onSelect).toHaveBeenCalledWith(firstEmoji);
  });

  it("chama onClose ao pressionar Escape", () => {
    const onClose = vi.fn();
    renderPicker({ onClose });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao clicar fora do picker", () => {
    const onClose = vi.fn();
    renderPicker({ onClose });

    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("não chama onClose ao clicar no botão âncora", () => {
    const onClose = vi.fn();
    const { anchorRef } = renderPicker({ onClose });

    fireEvent.mouseDown(anchorRef.current!);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("exibe emojis recentes quando existem no localStorage", () => {
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(["🚀"]));

    renderPicker({});

    expect(screen.getByRole("button", { name: "Inserir emoji 🚀" })).toBeInTheDocument();
  });
});

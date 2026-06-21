import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageReactionBar, MessageReactionList } from "../components/MessageReactions";

describe("MessageReactionBar", () => {
  it("abre o menu de reações ao clicar no botão", () => {
    render(<MessageReactionBar isOwn={false} onReact={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Reagir à mensagem" }));

    expect(screen.getByRole("menu", { name: "Escolher reação" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reagir com 👍" })).toBeInTheDocument();
  });

  it("chama onReact e fecha o menu ao escolher um emoji", () => {
    const onReact = vi.fn();
    render(<MessageReactionBar isOwn={true} onReact={onReact} />);

    fireEvent.click(screen.getByRole("button", { name: "Reagir à mensagem" }));
    fireEvent.click(screen.getByRole("button", { name: "Reagir com ❤️" }));

    expect(onReact).toHaveBeenCalledWith("❤️");
    expect(screen.queryByRole("menu", { name: "Escolher reação" })).not.toBeInTheDocument();
  });
});

describe("MessageReactionList", () => {
  it("não renderiza nada quando não há reações", () => {
    const { container } = render(
      <MessageReactionList reactions={[]} isOwn={false} onReact={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("agrupa reações iguais e destaca a do usuário atual", () => {
    render(
      <MessageReactionList
        reactions={[
          { emoji: "👍", userId: "u1" },
          { emoji: "👍", userId: "u2" },
          { emoji: "❤️", userId: "u1" },
        ]}
        currentUserId="u1"
        isOwn={false}
        onReact={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "2 reação(ões) com 👍" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 reação(ões) com ❤️" })).toBeInTheDocument();
  });

  it("chama onReact ao clicar em uma reação agrupada", () => {
    const onReact = vi.fn();
    render(
      <MessageReactionList
        reactions={[{ emoji: "😂", userId: "u2" }]}
        currentUserId="u1"
        isOwn={true}
        onReact={onReact}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "1 reação(ões) com 😂" }));

    expect(onReact).toHaveBeenCalledWith("😂");
  });
});

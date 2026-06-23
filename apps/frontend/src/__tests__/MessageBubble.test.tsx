import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageBubble } from "../components/MessageBubble";
import { Message } from "../types";

const baseMessage: Message = {
  id: "m1",
  content: "Olá, pessoal!",
  type: "public",
  senderId: "u1",
  forumId: "f1",
  createdAt: new Date().toISOString(),
  sender: { id: "u1", username: "Lara", email: "lara@email.com", isEmailVerified: true },
};

describe("MessageBubble", () => {
  const onReact = vi.fn();

  it("exibe o conteúdo da mensagem pública", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} onReact={onReact} />);
    expect(screen.getByText("Olá, pessoal!")).toBeInTheDocument();
    expect(screen.getByText("Lara")).toBeInTheDocument();
  });

  it("exibe indicação de mensagem privada", () => {
    const privateMessage: Message = {
      ...baseMessage,
      type: "private",
      recipientId: "u2",
      recipient: { id: "u2", username: "Lucas", email: "lucas@email.com", isEmailVerified: true },
    };
    render(<MessageBubble message={privateMessage} isOwn={true} onReact={onReact} />);
    expect(screen.getByText("Você")).toBeInTheDocument();
    expect(screen.getByText(/mensagem privada para Lucas/)).toBeInTheDocument();
  });

  it("renderiza reações agrupadas", () => {
    const messageWithReactions: Message = {
      ...baseMessage,
      reactions: [
        { emoji: "👍", userId: "u2" },
        { emoji: "👍", userId: "u3" },
      ],
    };

    render(
      <MessageBubble
        message={messageWithReactions}
        isOwn={false}
        currentUserId="u1"
        onReact={onReact}
      />
    );

    expect(screen.getByRole("button", { name: "2 reação(ões) com 👍" })).toBeInTheDocument();
  });

  it("abre lightbox ao clicar na imagem da mensagem", () => {
    const messageWithImage: Message = {
      ...baseMessage,
      content: "",
      imageUrl: "/api/uploads/foto.png",
    };

    render(<MessageBubble message={messageWithImage} isOwn={false} onReact={onReact} />);

    fireEvent.click(screen.getByRole("button", { name: "Ampliar imagem" }));

    expect(screen.getByRole("dialog", { name: "Visualização ampliada da imagem" })).toBeInTheDocument();
  });

  it("quebra mensagens muito longas sem espaços", () => {
    const longMessage: Message = {
      ...baseMessage,
      content: "o".repeat(200),
    };

    render(<MessageBubble message={longMessage} isOwn={false} onReact={onReact} />);

    expect(screen.getByText(longMessage.content)).toHaveClass("break-anywhere");
    expect(screen.getByText(longMessage.content)).toHaveClass("text-justify");
  });
});

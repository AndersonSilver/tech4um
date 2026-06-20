import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "../components/MessageBubble";
import { Message } from "../types";

const baseMessage: Message = {
  id: "m1",
  content: "Olá, pessoal!",
  type: "public",
  senderId: "u1",
  forumId: "f1",
  createdAt: new Date().toISOString(),
  sender: { id: "u1", username: "Lara", email: "lara@email.com" },
};

describe("MessageBubble", () => {
  it("exibe o conteúdo da mensagem pública", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText("Olá, pessoal!")).toBeInTheDocument();
    expect(screen.getByText("Lara")).toBeInTheDocument();
  });

  it("exibe indicação de mensagem privada", () => {
    const privateMessage: Message = {
      ...baseMessage,
      type: "private",
      recipientId: "u2",
      recipient: { id: "u2", username: "Lucas", email: "lucas@email.com" },
    };
    render(<MessageBubble message={privateMessage} isOwn={true} />);
    expect(screen.getByText(/mensagem privada para Lucas/)).toBeInTheDocument();
  });
});

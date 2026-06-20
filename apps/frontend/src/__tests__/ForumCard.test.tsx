import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ForumCard } from "../components/ForumCard";
import { Forum } from "../types";

const forum: Forum = {
  id: "1",
  name: "product-development-stuff",
  description: "Sala sobre produto e dev",
  ownerId: "owner-1",
  createdAt: new Date().toISOString(),
  participants: [
    { id: "p1", userId: "u1", isOnline: true, user: { id: "u1", username: "Lara", email: "lara@email.com", isEmailVerified: true, mfaEnabled: false } },
  ],
};

describe("ForumCard", () => {
  it("exibe o nome do fórum", () => {
    render(<ForumCard forum={forum} size="medium" />);
    expect(screen.getByText("product-development-stuff")).toBeInTheDocument();
  });

  it("chama onClick ao ser clicado", () => {
    const onClick = vi.fn();
    render(<ForumCard forum={forum} size="medium" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("exibe a contagem de participantes", () => {
    render(<ForumCard forum={forum} size="medium" />);
    expect(screen.getByText(/1 pessoa/)).toBeInTheDocument();
  });
});

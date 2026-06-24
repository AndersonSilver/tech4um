import { describe, it, expect } from "vitest";
import { ForumCard } from "../components/ForumCard";
import { Forum } from "../types";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

const forum: Forum = {
  id: "1",
  name: "product-development-stuff",
  description: "Sala sobre produto e dev",
  ownerId: "owner-1",
  createdAt: new Date().toISOString(),
  participants: [
    {
      id: "p1",
      userId: "u1",
      isOnline: true,
      user: {
        id: "u1",
        username: "Lara",
        email: "lara@email.com",
        
      },
    },
    {
      id: "p2",
      userId: "u2",
      isOnline: false,
      user: {
        id: "u2",
        username: "João",
        email: "joao@email.com",
        
      },
    },
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

  it("exibe contagem de participantes online", () => {
    render(<ForumCard forum={forum} size="medium" />);
    expect(screen.getByText("1 online · 2 inscritos")).toBeInTheDocument();
    expect(screen.getByLabelText("1 participante online")).toBeInTheDocument();
  });

  it("exibe descrição em cards pequenos", () => {
    render(<ForumCard forum={forum} size="small" />);
    expect(screen.getByText("Sala sobre produto e dev")).toBeInTheDocument();
  });

  it("não exibe descrição quando ausente", () => {
    render(<ForumCard forum={{ ...forum, description: undefined }} size="small" />);
    expect(screen.queryByText("Sala sobre produto e dev")).not.toBeInTheDocument();
  });
});

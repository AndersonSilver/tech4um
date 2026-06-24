import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ForumCarousel } from "../components/ForumCarousel";
import { Forum } from "../types";

const forums: Forum[] = [
  {
    id: "f1",
    name: "Sala A",
    ownerId: "o1",
    createdAt: new Date().toISOString(),
    participants: [],
  },
  {
    id: "f2",
    name: "Sala B",
    ownerId: "o1",
    createdAt: new Date().toISOString(),
    participants: [],
  },
];

describe("ForumCarousel", () => {
  it("lista salas e destaca a ativa", () => {
    render(<ForumCarousel forums={forums} activeForumId="f2" onSelect={vi.fn()} />);

    expect(screen.getByText("Sala A")).toBeInTheDocument();
    expect(screen.getByText("Sala B")).toBeInTheDocument();
    expect(screen.getByText("Outras salas")).toBeInTheDocument();
  });

  it("chama onSelect ao clicar em uma sala", () => {
    const onSelect = vi.fn();
    render(<ForumCarousel forums={forums} activeForumId="f1" onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Sala B"));
    expect(onSelect).toHaveBeenCalledWith(forums[1]);
  });
});

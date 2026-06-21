import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ForumFilters } from "../components/ForumFilters";

describe("ForumFilters", () => {
  it("abre o menu e alterna ordenação para mais populares", () => {
    const onSortChange = vi.fn();
    render(
      <ForumFilters
        sortMode="recent"
        activityFilter="all"
        onSortChange={onSortChange}
        onActivityFilterChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtros e ordenação" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: /Mais populares/i }));

    expect(onSortChange).toHaveBeenCalledWith("popular");
  });

  it("abre o menu e alterna filtro de atividade", () => {
    const onActivityFilterChange = vi.fn();
    render(
      <ForumFilters
        sortMode="recent"
        activityFilter="all"
        onSortChange={vi.fn()}
        onActivityFilterChange={onActivityFilterChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtros e ordenação" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: /Com atividade/i }));

    expect(onActivityFilterChange).toHaveBeenCalledWith("online");
  });

  it("limpa filtros ativos", () => {
    const onSortChange = vi.fn();
    const onActivityFilterChange = vi.fn();

    render(
      <ForumFilters
        sortMode="popular"
        activityFilter="online"
        onSortChange={onSortChange}
        onActivityFilterChange={onActivityFilterChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtros e ordenação" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(onSortChange).toHaveBeenCalledWith("recent");
    expect(onActivityFilterChange).toHaveBeenCalledWith("all");
  });
});

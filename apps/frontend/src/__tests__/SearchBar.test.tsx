import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "../components/SearchBar";

describe("SearchBar", () => {
  it("exibe o valor controlado no input", () => {
    render(<SearchBar value="devops" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Em busca de uma sala? Encontre-a aqui")).toHaveValue("devops");
  });

  it("chama onChange ao digitar", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("Em busca de uma sala? Encontre-a aqui"), {
      target: { value: "cloud" },
    });

    expect(onChange).toHaveBeenCalledWith("cloud");
  });

  it("chama onSubmit ao pressionar Enter", () => {
    const onSubmit = vi.fn();
    render(<SearchBar value="ia" onChange={() => {}} onSubmit={onSubmit} />);

    fireEvent.keyDown(screen.getByPlaceholderText("Em busca de uma sala? Encontre-a aqui"), {
      key: "Enter",
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("chama onSubmit ao clicar no botão de busca", () => {
    const onSubmit = vi.fn();
    render(<SearchBar value="ia" onChange={() => {}} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Buscar sala" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

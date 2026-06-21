import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ForumSortToggle } from "../components/ForumSortToggle";

describe("ForumSortToggle", () => {
  it("alterna para mais populares", () => {
    const onChange = vi.fn();
    render(<ForumSortToggle value="recent" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Mais populares" }));
    expect(onChange).toHaveBeenCalledWith("popular");
  });
});

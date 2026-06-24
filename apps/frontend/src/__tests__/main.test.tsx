import { describe, it, expect, vi } from "vitest";

const renderMock = vi.fn();

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: () => ({ render: renderMock }),
  },
}));

vi.mock("./App", () => ({ default: () => null }));
vi.mock("./index.css", () => ({}));

describe("main", () => {
  it("monta App no elemento root", async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import("../main");
    expect(renderMock).toHaveBeenCalled();
  });
});

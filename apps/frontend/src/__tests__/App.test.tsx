import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App";

vi.mock("../pages/Dashboard", () => ({ Dashboard: () => <div>dashboard-page</div> }));
vi.mock("../pages/ChatRoom", () => ({ ChatRoom: () => <div>chat-page</div> }));
vi.mock("../pages/Settings", () => ({ Settings: () => <div>settings-page</div> }));
vi.mock("../context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("../context/SocketContext", () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("App", () => {
  it("renderiza rota inicial do dashboard", () => {
    window.history.pushState({}, "", "/");
    render(<App />);
    expect(screen.getByText("dashboard-page")).toBeInTheDocument();
  });

  it("renderiza rota de configurações", () => {
    window.history.pushState({}, "", "/settings");
    render(<App />);
    expect(screen.getByText("settings-page")).toBeInTheDocument();
  });
});

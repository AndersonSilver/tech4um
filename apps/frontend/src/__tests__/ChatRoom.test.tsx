import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ChatRoom } from "../pages/ChatRoom";

vi.mock("../components/Header", () => ({ Header: () => <div>header</div> }));
vi.mock("../components/ParticipantsList", () => ({
  ParticipantsList: () => <div>participants</div>,
}));
vi.mock("../components/MessageBubble", () => ({
  MessageBubble: ({ message }: { message: { content: string } }) => <div>{message.content}</div>,
}));
vi.mock("../components/ForumCarousel", () => ({
  ForumCarousel: () => <div>carousel</div>,
}));
vi.mock("../components/ChatMessageComposer", () => ({
  ChatMessageComposer: () => <div>composer</div>,
  uploadForumImage: vi.fn(),
}));
vi.mock("../context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../context/SocketContext", () => ({ useSocket: vi.fn() }));
vi.mock("../services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const forum = {
  id: "forum-1",
  name: "Cloud Computing",
  ownerId: "u1",
  createdAt: new Date().toISOString(),
  participants: [],
};

describe("ChatRoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "u1", username: "Lara", email: "l@x.com", isEmailVerified: true },
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);
    vi.mocked(useSocket).mockReturnValue({
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    } as unknown as ReturnType<typeof useSocket>);
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes("/messages")) return Promise.resolve({ data: [{ id: "m1", content: "Olá sala!" }] });
      if (url.includes("/forums/forum-1")) return Promise.resolve({ data: forum });
      return Promise.resolve({ data: [forum] });
    });
    vi.mocked(api.post).mockResolvedValue({ data: {} });
  });

  it("redireciona quando usuário não autenticado", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    render(
      <MemoryRouter initialEntries={["/forums/forum-1"]}>
        <Routes>
          <Route path="/forums/:id" element={<ChatRoom />} />
        </Routes>
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("carrega fórum e mensagens", async () => {
    render(
      <MemoryRouter initialEntries={["/forums/forum-1"]}>
        <Routes>
          <Route path="/forums/:id" element={<ChatRoom />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Cloud Computing")).toBeInTheDocument());
    expect(screen.getByText("composer")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/forums/forum-1/messages");
  });
});

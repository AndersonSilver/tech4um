import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { SocketProvider, useSocket } from "../context/SocketContext";

const disconnect = vi.fn();
const ioMock = vi.fn(() => ({ disconnect }));

vi.mock("socket.io-client", () => ({
  io: (...args: Parameters<typeof ioMock>) => ioMock(...args),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../context/AuthContext";

function SocketProbe() {
  const socket = useSocket();
  return <div data-testid="socket">{socket ? "connected" : "disconnected"}</div>;
}

describe("SocketContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ioMock.mockReturnValue({ disconnect });
  });

  it("não conecta enquanto auth está carregando", () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    } as ReturnType<typeof useAuth>);

    render(
      <SocketProvider>
        <SocketProbe />
      </SocketProvider>
    );

    expect(ioMock).not.toHaveBeenCalled();
  });

  it("conecta socket quando autenticado", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    const { getByTestId } = render(
      <SocketProvider>
        <SocketProbe />
      </SocketProvider>
    );

    await waitFor(() => expect(getByTestId("socket")).toHaveTextContent("connected"));
    expect(ioMock).toHaveBeenCalledWith(window.location.origin, { withCredentials: true });
  });

  it("desconecta quando usuário não está autenticado", async () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    const { rerender, getByTestId } = render(
      <SocketProvider>
        <SocketProbe />
      </SocketProvider>
    );

    await waitFor(() => expect(getByTestId("socket")).toHaveTextContent("connected"));

    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as ReturnType<typeof useAuth>);

    rerender(
      <SocketProvider>
        <SocketProbe />
      </SocketProvider>
    );

    await waitFor(() => expect(getByTestId("socket")).toHaveTextContent("disconnected"));
    expect(disconnect).toHaveBeenCalled();
  });
});

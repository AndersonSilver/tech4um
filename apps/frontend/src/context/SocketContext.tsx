import { createContext, useContext, useEffect, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    // O token vive em cookie httpOnly — `withCredentials` faz o navegador
    // enviar esse cookie no handshake do WebSocket automaticamente.
    // O backend extrai e valida o token a partir do header `cookie` do handshake.
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3333", {
      withCredentials: true,
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, isLoading]);

  return (
    <SocketContext.Provider value={socketRef.current}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

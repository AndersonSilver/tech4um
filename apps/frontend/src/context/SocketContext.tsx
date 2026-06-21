import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setSocket((current) => {
        current?.disconnect();
        return null;
      });
      return;
    }

    const configured = import.meta.env.VITE_SOCKET_URL;
    const socketUrl =
      configured && !configured.includes("localhost")
        ? configured
        : typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:5173";

    const nextSocket = io(socketUrl, {
      withCredentials: true,
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
      setSocket((current) => (current === nextSocket ? null : current));
    };
  }, [isAuthenticated, isLoading]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";
import { User } from "../types";

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // O token vive em um cookie httpOnly (o JS nunca tem acesso a ele).
  // Para saber se há uma sessão válida, perguntamos ao backend via /auth/me —
  // o cookie é enviado automaticamente pelo navegador.
  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
  }

  async function register(username: string, email: string, password: string) {
    const { data } = await api.post("/auth/register", { username, email, password });
    setUser(data.user);
  }

  async function loginWithGoogle(idToken: string) {
    const { data } = await api.post("/auth/google", { idToken });
    setUser(data.user);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

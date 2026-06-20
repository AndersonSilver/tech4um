import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";
import { User } from "../types";

interface AuthContextData {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("@tech4um:token")
  );

  useEffect(() => {
    const storedUser = localStorage.getItem("@tech4um:user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  function persistSession(newToken: string, newUser: User) {
    localStorage.setItem("@tech4um:token", newToken);
    localStorage.setItem("@tech4um:user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data.token, data.user);
  }

  async function register(username: string, email: string, password: string) {
    const { data } = await api.post("/auth/register", { username, email, password });
    persistSession(data.token, data.user);
  }

  async function loginWithGoogle(idToken: string) {
    const { data } = await api.post("/auth/google", { idToken });
    persistSession(data.token, data.user);
  }

  function logout() {
    localStorage.removeItem("@tech4um:token");
    localStorage.removeItem("@tech4um:user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, login, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";
import { User } from "../types";

type LoginResult = { mfaRequired: true; mfaToken: string } | { mfaRequired: false };

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, captchaToken: string) => Promise<LoginResult>;
  register: (
    username: string,
    email: string,
    password: string,
    captchaToken: string
  ) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
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
      const { data } = await api.get<User | null>("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshUser() {
    await restoreSession();
  }

  async function login(email: string, password: string, captchaToken: string): Promise<LoginResult> {
    const { data } = await api.post("/auth/login", { email, password, captchaToken });

    if (data.mfaRequired) {
      return { mfaRequired: true, mfaToken: data.mfaToken };
    }

    setUser(data.user);
    return { mfaRequired: false };
  }

  async function verifyMfa(mfaToken: string, code: string) {
    const { data } = await api.post("/auth/mfa/verify", { mfaToken, code });
    setUser(data.user);
  }

  async function register(
    username: string,
    email: string,
    password: string,
    captchaToken: string
  ) {
    const { data } = await api.post("/auth/register", { username, email, password, captchaToken });
    setUser(data.user);
  }

  async function loginWithGoogle(code: string) {
    const { data } = await api.post("/auth/google", {
      code,
      redirectUri: window.location.origin,
    });
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
        verifyMfa,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

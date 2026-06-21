import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { loadGoogleIdentityScript } from "../services/googleIdentity";

interface GoogleLoginButtonProps {
  onSuccess: () => void;
  onError?: (message: string) => void;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  async function handleClick() {
    if (!clientId) return;

    setLoading(true);
    try {
      await loadGoogleIdentityScript();

      if (!window.google?.accounts?.oauth2) {
        throw new Error("Google OAuth indisponível");
      }

      await new Promise<void>((resolve, reject) => {
        const client = window.google!.accounts.oauth2.initCodeClient({
          client_id: clientId,
          scope: "openid email profile",
          ux_mode: "popup",
          callback: async (response) => {
            if (response.error) {
              reject(new Error(response.error));
              return;
            }

            try {
              await loginWithGoogle(response.code);
              onSuccess();
              resolve();
            } catch {
              reject(new Error("login_failed"));
            }
          },
        });

        client.requestCode();
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message === "access_denied"
          ? "Login com Google cancelado."
          : "Não foi possível entrar com o Google.";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }

  if (!clientId) {
    return (
      <p className="text-center font-poppins text-xs text-textgray">
        Login com Google não configurado.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-button border border-bordergray bg-white px-4 font-poppins text-sm font-medium text-textgray transition-colors hover:bg-background disabled:opacity-60"
    >
      <GoogleIcon />
      <span>{loading ? "Conectando..." : "Continuar com o Google"}</span>
    </button>
  );
}

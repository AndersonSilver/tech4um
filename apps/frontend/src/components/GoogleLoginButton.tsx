import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

interface GoogleLoginButtonProps {
  onSuccess: () => void;
  onError?: (message: string) => void;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !buttonRef.current) return;

    function setup() {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            await loginWithGoogle(response.credential);
            onSuccess();
          } catch {
            onError?.("Não foi possível entrar com o Google.");
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        width: 318,
        text: "continue_with",
        locale: "pt-BR",
      });
    }

    if (window.google) {
      setup();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          setup();
        }
      }, 200);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={buttonRef} />;
}

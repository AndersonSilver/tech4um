import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoogleLoginButton } from "../components/GoogleLoginButton";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../services/googleIdentity", () => ({
  loadGoogleIdentityScript: vi.fn().mockResolvedValue(undefined),
}));

import { useAuth } from "../context/AuthContext";

describe("GoogleLoginButton", () => {
  const originalClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  beforeEach(() => {
    (import.meta.env as any).VITE_GOOGLE_CLIENT_ID = "google-client-id";
    vi.mocked(useAuth).mockReturnValue({
      loginWithGoogle: vi.fn().mockResolvedValue(undefined),
    } as unknown as ReturnType<typeof useAuth>);
    vi.clearAllMocks();
  });

  afterEach(() => {
    (import.meta.env as any).VITE_GOOGLE_CLIENT_ID = originalClientId;
  });

  it("informa quando client id não está configurado", () => {
    (import.meta.env as any).VITE_GOOGLE_CLIENT_ID = "";
    render(<GoogleLoginButton onSuccess={vi.fn()} />);
    expect(screen.getByText("Login com Google não configurado.")).toBeInTheDocument();
  });

  it("inicia fluxo OAuth e chama loginWithGoogle", async () => {
    const loginWithGoogle = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const requestCode = vi.fn();

    vi.mocked(useAuth).mockReturnValue({ loginWithGoogle } as unknown as ReturnType<typeof useAuth>);
    (window as any).google = {
      accounts: {
        oauth2: {
          initCodeClient: vi.fn(({ callback }: { callback: (r: { code: string }) => void }) => {
            callback({ code: "auth-code" });
            return { requestCode };
          }),
        },
      },
    };

    render(<GoogleLoginButton onSuccess={onSuccess} />);
    fireEvent.click(screen.getByText("Continuar com o Google"));

    await waitFor(() => expect(loginWithGoogle).toHaveBeenCalledWith("auth-code"));
    expect(onSuccess).toHaveBeenCalled();
  });
});

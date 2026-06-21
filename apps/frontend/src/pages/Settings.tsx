import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { MfaSetup } from "../components/MfaSetup";
import { ProfileAvatarEditor } from "../components/ProfileAvatarEditor";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { getUserInitial, resolveAvatarUrl } from "../utils/resolveAvatarUrl";

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "neutral";
}) {
  const styles = {
    success: "bg-green-500/10 text-green-700 border-green-500/20",
    warning: "bg-secondary-default/10 text-secondary-dark border-secondary-default/20",
    neutral: "bg-surface text-textgray border-bordergray/60",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-poppins text-[11px] ${styles[tone]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "success"
            ? "bg-green-500"
            : tone === "warning"
              ? "bg-secondary-default"
              : "bg-bordergray"
        }`}
      />
      {label}
    </span>
  );
}

export function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  if (!isLoading && !isAuthenticated) {
    navigate("/");
    return null;
  }

  const avatarSrc = resolveAvatarUrl(user?.avatarUrl);

  async function resendVerification() {
    if (!user) return;
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background page-fade-in">
      <Header />
      <main className="layout-page-x pt-6 sm:pt-10 pb-16 sm:pb-24 flex flex-col gap-6 sm:gap-8">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-textgray font-poppins self-start border-0 bg-transparent p-0 cursor-pointer"
        >
          <span>←</span>
          <span className="text-base">Voltar para o dashboard</span>
        </button>

        <div className="flex flex-col gap-2">
          <h1 className="font-poppins font-bold text-2xl text-primary-dark m-0">
            Configurações da conta
          </h1>
          <p className="font-poppins text-sm text-textgray m-0">
            Gerencie seu perfil, conta e segurança em um só lugar.
          </p>
        </div>

        {user && (
          <section className="bg-white rounded-card shadow-card p-6 flex flex-wrap items-center gap-6">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-bordergray shrink-0 shadow-compact">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.username} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-poppins text-xl text-background bg-primary-dark">
                  {getUserInitial(user.username)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-[220px] flex-1">
              <span className="font-poppins font-bold text-base text-textgray">{user.username}</span>
              <span className="font-poppins text-sm text-bordergray break-all">{user.email}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill
                label={user.isEmailVerified ? "E-mail verificado" : "E-mail pendente"}
                tone={user.isEmailVerified ? "success" : "warning"}
              />
              <StatusPill
                label={user.mfaEnabled ? "MFA ativo" : "MFA desativado"}
                tone={user.mfaEnabled ? "success" : "neutral"}
              />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] gap-6 w-full items-stretch">
          <section className="bg-white rounded-card shadow-card p-8 flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-1 pb-2 border-b border-bordergray/30">
              <h2 className="font-poppins font-bold text-lg text-primary-dark m-0">Perfil</h2>
              <p className="font-poppins text-xs text-bordergray m-0">
                Personalize como os outros participantes te veem no chat.
              </p>
            </div>

            {user && (
              <ProfileAvatarEditor username={user.username} avatarUrl={user.avatarUrl} />
            )}
          </section>

          <div className="flex flex-col gap-6 h-full">
            <section className="bg-white rounded-card shadow-card p-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1 pb-2 border-b border-bordergray/30">
                <h2 className="font-poppins font-bold text-lg text-primary-dark m-0">Conta</h2>
                <p className="font-poppins text-xs text-bordergray m-0">
                  Verificação e dados de acesso.
                </p>
              </div>

              <div className="rounded-compact bg-surface/70 px-4 py-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-poppins text-[10px] uppercase tracking-wide text-bordergray">
                    E-mail principal
                  </span>
                  <span className="font-poppins text-sm text-textgray break-all">{user?.email}</span>
                </div>

                {user?.isEmailVerified ? (
                  <StatusPill label="Verificado com sucesso" tone="success" />
                ) : (
                  <div className="flex flex-col gap-3 items-start">
                    <StatusPill label="Aguardando verificação" tone="warning" />
                    {resent ? (
                      <p className="font-poppins text-xs text-primary-dark m-0">
                        Enviamos um novo link de verificação. Confira sua caixa de entrada.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={resendVerification}
                        disabled={resending}
                        className="h-10 px-4 rounded-button border border-primary-dark text-primary-dark font-poppins text-sm bg-white cursor-pointer disabled:opacity-60"
                      >
                        {resending ? "Enviando..." : "Reenviar e-mail de verificação"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-card shadow-card p-8 flex flex-col gap-5 flex-1">
              <div className="flex flex-col gap-1 pb-2 border-b border-bordergray/30">
                <h2 className="font-poppins font-bold text-lg text-primary-dark m-0">Segurança</h2>
                <p className="font-poppins text-xs text-bordergray m-0">
                  Autenticação em dois fatores para proteger o login.
                </p>
              </div>

              <div className="rounded-compact bg-surface/70 px-4 py-4 flex-1">
                <MfaSetup />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

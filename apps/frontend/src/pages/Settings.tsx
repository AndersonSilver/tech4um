import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { MfaSetup } from "../components/MfaSetup";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  if (!isLoading && !isAuthenticated) {
    navigate("/");
    return null;
  }

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
      <main className="px-[189px] pt-10 pb-24 flex flex-col gap-8 max-w-[900px]">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-textgray font-poppins self-start"
        >
          <span>←</span>
          <span className="text-base">Voltar para o dashboard</span>
        </button>

        <h1 className="font-poppins font-bold text-2xl text-primary-dark m-0">
          Configurações de segurança
        </h1>

        {/* Status de verificação de e-mail */}
        <section className="bg-white rounded-card shadow-card p-8 flex flex-col gap-3">
          <h2 className="font-poppins font-bold text-lg text-textgray m-0">E-mail</h2>
          {user?.isEmailVerified ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-poppins text-sm text-textgray">
                {user.email} — verificado
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3 items-start">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary-default" />
                <span className="font-poppins text-sm text-textgray">
                  {user?.email} — não verificado
                </span>
              </div>
              {resent ? (
                <p className="font-poppins text-xs text-primary-dark m-0">
                  Enviamos um novo link de verificação. Confira sua caixa de entrada.
                </p>
              ) : (
                <button
                  onClick={resendVerification}
                  disabled={resending}
                  className="h-10 px-4 rounded-button border border-primary-dark text-primary-dark font-poppins text-sm disabled:opacity-60"
                >
                  {resending ? "Enviando..." : "Reenviar e-mail de verificação"}
                </button>
              )}
            </div>
          )}
        </section>

        {/* MFA */}
        <section className="bg-white rounded-card shadow-card p-8 flex flex-col gap-4">
          <h2 className="font-poppins font-bold text-lg text-textgray m-0">
            Autenticação em dois fatores
          </h2>
          <MfaSetup />
        </section>
      </main>
    </div>
  );
}

import { useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

type Step = "idle" | "showing-qr" | "done";

export function MfaSetup() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState<Step>("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startSetup() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/mfa/setup");
      setQrCode(data.qrCodeDataUrl);
      setSecret(data.secret);
      setStep("showing-qr");
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError("Sessão expirada. Faça login novamente e tente ativar o MFA.");
      } else {
        setError("Não foi possível iniciar a configuração de MFA.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable() {
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/mfa/enable", { code });
      await refreshUser();
      setStep("done");
      setCode("");
    } catch {
      setError("Código inválido. Verifique o app autenticador e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function disableMfa() {
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/mfa/disable", { code });
      await refreshUser();
      setCode("");
    } catch {
      setError("Código inválido. Não foi possível desabilitar o MFA.");
    } finally {
      setLoading(false);
    }
  }

  if (user?.mfaEnabled) {
    return (
      <div className="flex flex-col gap-4 items-start">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-poppins font-semibold text-textgray text-sm">
            Autenticação em dois fatores (MFA) está ativa
          </span>
        </div>
        <p className="font-poppins text-xs text-textgray m-0">
          Para desativar, informe um código atual do seu app autenticador:
        </p>
        <div className="flex gap-2 items-center">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            className="border border-bordergray rounded px-3 py-2 font-roboto tracking-widest text-center w-32 outline-none"
          />
          <button
            onClick={disableMfa}
            disabled={loading || code.length !== 6}
            className="h-10 px-4 rounded-button border border-secondary-default text-secondary-default font-poppins text-sm disabled:opacity-50"
          >
            Desativar MFA
          </button>
        </div>
        {error && <p className="text-secondary-default text-sm font-poppins m-0">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 items-start">
      {step === "idle" && (
        <>
          <p className="font-poppins text-sm text-textgray m-0">
            Adicione uma camada extra de segurança à sua conta usando um app autenticador
            (Google Authenticator, Authy, 1Password, etc.).
          </p>
          <button
            onClick={startSetup}
            disabled={loading}
            className="bg-primary-dark h-10 px-4 rounded-button font-poppins font-semibold text-background text-sm disabled:opacity-60"
          >
            {loading ? "Aguarde..." : "Ativar MFA"}
          </button>
        </>
      )}

      {step === "showing-qr" && (
        <>
          <p className="font-poppins text-sm text-textgray m-0">
            1. Escaneie o QR code no seu app autenticador:
          </p>
          {qrCode && <img src={qrCode} alt="QR Code MFA" className="w-44 h-44" />}
          <p className="font-poppins text-[11px] text-textgray m-0">
            Ou insira manualmente o código:{" "}
            <code className="bg-background px-1 py-0.5 rounded">{secret}</code>
          </p>
          <p className="font-poppins text-sm text-textgray m-0">
            2. Digite o código de 6 dígitos gerado pelo app:
          </p>
          <div className="flex gap-2 items-center">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              className="border border-bordergray rounded px-3 py-2 font-roboto tracking-widest text-center w-32 outline-none"
            />
            <button
              onClick={confirmEnable}
              disabled={loading || code.length !== 6}
              className="bg-primary-dark h-10 px-4 rounded-button font-poppins font-semibold text-background text-sm disabled:opacity-60"
            >
              Confirmar
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <p className="font-poppins font-semibold text-primary-default text-sm m-0">
          ✓ MFA ativado com sucesso!
        </p>
      )}

      {error && <p className="text-secondary-default text-sm font-poppins m-0">{error}</p>}
    </div>
  );
}

import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { executeRecaptcha } from "../services/recaptcha";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "login" | "register";

const inputClassName =
  "w-full h-11 px-3 font-roboto text-base text-primary-dark border border-bordergray rounded-button outline-none transition-colors placeholder:text-textgray/60 focus:border-primary-default focus:ring-2 focus:ring-primary-default/20";

function ModalBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-panel">
        {children}
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 border-b-2 py-3 text-center font-poppins text-sm font-semibold transition-colors ${
        active
          ? "border-primary-dark text-primary-dark"
          : "border-transparent text-textgray hover:text-primary-dark"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block font-roboto text-xs font-medium tracking-wide text-textgray">
      {children}
    </span>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-button border border-secondary-default/20 bg-secondary-default/5 px-3 py-2 font-poppins text-sm text-secondary-default"
    >
      {message}
    </p>
  );
}

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { login, register, verifyMfa } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const captchaToken = await executeRecaptcha(mode === "login" ? "login" : "register");

      if (mode === "login") {
        const result = await login(email, password, captchaToken);
        if (result.mfaRequired) {
          setMfaToken(result.mfaToken);
        } else {
          onSuccess();
        }
      } else {
        await register(username, email, password, captchaToken);
        onSuccess();
      }
    } catch (err: any) {
      if (!err?.response) {
        setError("Não foi possível validar o reCAPTCHA. Tente novamente.");
        return;
      }

      setError(
        err?.response?.data?.message ||
          (mode === "login"
            ? "Não foi possível entrar. Verifique e-mail e senha."
            : "Não foi possível cadastrar. Verifique os dados informados.")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyMfa(e: FormEvent) {
    e.preventDefault();
    if (!mfaToken) return;

    setError("");
    setLoading(true);
    try {
      await verifyMfa(mfaToken, mfaCode);
      onSuccess();
    } catch {
      setError("Código de verificação inválido.");
    } finally {
      setLoading(false);
    }
  }

  if (mfaToken) {
    return (
      <ModalBackdrop>
        <form onSubmit={handleVerifyMfa} className="flex flex-col">
          <div className="border-b border-background px-8 pb-5 pt-8">
            <h2 className="m-0 font-poppins text-[22px] font-bold leading-tight text-primary-default">
              Verificação em duas etapas
            </h2>
            <p className="m-0 mt-2 font-poppins text-sm leading-relaxed text-textgray">
              Digite o código de 6 dígitos do seu app autenticador.
            </p>
          </div>

          <div className="flex flex-col gap-5 px-8 py-6">
            <label className="block w-full">
              <FieldLabel>Código de verificação</FieldLabel>
              <input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                className={`${inputClassName} text-center text-2xl tracking-[0.3em]`}
              />
            </label>

            {error && <ErrorMessage message={error} />}

            <button
              type="submit"
              disabled={loading || mfaCode.length !== 6}
              className="flex h-11 w-full items-center justify-center rounded-button bg-primary-dark px-4 disabled:opacity-60"
            >
              <span className="font-poppins text-base font-semibold text-background">
                {loading ? "Verificando..." : "Confirmar"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMfaToken(null)}
              className="font-poppins text-sm text-textgray transition-colors hover:text-primary-dark"
            >
              Voltar ao login
            </button>
          </div>
        </form>
      </ModalBackdrop>
    );
  }

  return (
    <ModalBackdrop>
      <div className="border-b border-background px-8 pb-0 pt-8">
        <h2 className="m-0 font-poppins text-[22px] font-bold leading-tight text-primary-default">
          {mode === "login" ? "Que bom ter você aqui!" : "Vamos criar sua conta!"}
        </h2>
        <p className="m-0 mt-2 font-poppins text-sm leading-relaxed text-textgray">
          {mode === "login"
            ? "Entre na sua conta para participar dos 4ums."
            : "Preencha os dados abaixo para começar."}
        </p>

        <div className="mt-6 flex">
          <TabButton active={mode === "login"} onClick={() => switchMode("login")}>
            Login
          </TabButton>
          <TabButton active={mode === "register"} onClick={() => switchMode("register")}>
            Cadastro
          </TabButton>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-6">
        {mode === "register" && (
          <label className="block w-full">
            <FieldLabel>Nome de usuário</FieldLabel>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder="Seu nome de usuário"
              className={inputClassName}
            />
          </label>
        )}

        <label className="block w-full">
          <FieldLabel>E-mail</FieldLabel>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seuemail@email.com"
            className={inputClassName}
          />
        </label>

        <label className="block w-full">
          <FieldLabel>Senha</FieldLabel>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            pattern={mode === "register" ? "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}" : undefined}
            title={
              mode === "register"
                ? "Mínimo 8 caracteres, com letra maiúscula, minúscula e número"
                : undefined
            }
            placeholder="••••••••"
            className={inputClassName}
          />
          {mode === "register" && (
            <span className="mt-1.5 block font-roboto text-[11px] leading-relaxed text-textgray">
              Mín. 8 caracteres, com maiúscula, minúscula e número
            </span>
          )}
        </label>

        {error && <ErrorMessage message={error} />}

        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center rounded-button bg-primary-dark px-4 disabled:opacity-60"
        >
          <span className="font-poppins text-base font-semibold text-background">
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
          </span>
        </button>

        <p className="m-0 text-center font-roboto text-[10px] leading-relaxed text-textgray">
          Este site é protegido pelo reCAPTCHA e aplicam-se a{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="text-primary-dark hover:underline"
          >
            Política de Privacidade
          </a>{" "}
          e os{" "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
            className="text-primary-dark hover:underline"
          >
            Termos de Serviço
          </a>{" "}
          do Google.
        </p>
      </form>

      <div className="flex flex-col gap-4 border-t border-background px-8 pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-background" />
          <span className="font-poppins text-xs text-textgray">ou continue com</span>
          <div className="h-px flex-1 bg-background" />
        </div>

        <GoogleLoginButton onSuccess={onSuccess} onError={setError} />

        <button
          type="button"
          onClick={onClose}
          className="font-poppins text-sm text-textgray transition-colors hover:text-primary-dark"
        >
          Cancelar
        </button>
      </div>
    </ModalBackdrop>
  );
}

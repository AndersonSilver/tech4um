import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleLoginButton } from "./GoogleLoginButton";

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "login" | "register";

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      onSuccess();
    } catch {
      setError(
        mode === "login"
          ? "Não foi possível entrar. Verifique e-mail e senha."
          : "Não foi possível cadastrar. Verifique os dados informados."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white flex flex-col gap-6 items-start p-10 rounded-2xl w-[398px]">
        <div className="flex flex-col text-textgray">
          <p className="font-poppins font-bold text-primary-default text-[22px] leading-6 m-0">
            {mode === "login" ? "Que bom ter você aqui!" : "Vamos criar sua conta!"}
          </p>
          <p className="font-poppins font-bold text-base leading-6 m-0">
            Para participar de um 4um é necessário fazer login.
          </p>
        </div>

        {/* Alternância Login / Cadastro */}
        <div className="flex gap-4 w-full border-b border-background">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`pb-2 font-poppins text-sm font-semibold ${
              mode === "login"
                ? "text-primary-dark border-b-2 border-primary-dark"
                : "text-textgray"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`pb-2 font-poppins text-sm font-semibold ${
              mode === "register"
                ? "text-primary-dark border-b-2 border-primary-dark"
                : "text-textgray"
            }`}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start w-full">
          {mode === "register" && (
            <label className="flex flex-col items-start w-full border border-background rounded px-3">
              <span className="font-roboto text-xs text-textgray tracking-[0.15px] bg-white px-1">
                Nome de usuário
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                placeholder="Seu nome de usuário"
                className="w-full py-[7px] font-roboto text-base text-primary-dark tracking-[0.15px] outline-none bg-transparent"
              />
            </label>
          )}

          <label className="flex flex-col items-start w-full border border-background rounded px-3">
            <span className="font-roboto text-xs text-textgray tracking-[0.15px] bg-white px-1">
              E-mail
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@email.com"
              className="w-full py-[7px] font-roboto text-base text-primary-dark tracking-[0.15px] outline-none bg-transparent"
            />
          </label>

          <label className="flex flex-col items-start w-full border border-background rounded px-3">
            <span className="font-roboto text-xs text-textgray tracking-[0.15px] bg-white px-1">
              Senha
            </span>
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
              className="w-full py-[7px] font-roboto text-base text-primary-dark tracking-[0.15px] outline-none bg-transparent"
            />
            {mode === "register" && (
              <span className="font-roboto text-[11px] text-textgray px-1 pb-1">
                Mín. 8 caracteres, com maiúscula, minúscula e número
              </span>
            )}
          </label>

          {error && <p className="text-secondary-default text-sm font-poppins">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary-dark h-11 flex items-center justify-center px-4 rounded-button w-full disabled:opacity-60"
          >
            <span className="font-poppins font-semibold text-base text-background">
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
            </span>
          </button>
        </form>

        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px bg-background" />
          <span className="font-poppins text-xs text-textgray">ou</span>
          <div className="flex-1 h-px bg-background" />
        </div>

        <div className="w-full flex justify-center">
          <GoogleLoginButton onSuccess={onSuccess} onError={setError} />
        </div>

        <button
          onClick={onClose}
          className="text-textgray text-xs font-poppins self-center hover:text-primary-dark"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

type Status = "loading" | "success" | "error";

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Link de verificação inválido.");
      return;
    }

    api
      .get("/auth/verify-email", { params: { token } })
      .then(() => {
        setStatus("success");
        setMessage("E-mail verificado com sucesso!");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Não foi possível verificar seu e-mail. O link pode ter expirado.");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center page-fade-in">
      <div className="bg-white flex flex-col gap-6 items-center p-10 rounded-2xl w-[420px] text-center">
        {status === "loading" && (
          <p className="font-poppins text-textgray">Verificando seu e-mail...</p>
        )}

        {status === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-primary-dark flex items-center justify-center text-background text-2xl">
              ✓
            </div>
            <p className="font-poppins font-bold text-primary-default text-xl m-0">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary-dark h-11 px-6 rounded-button font-poppins font-semibold text-background"
            >
              Ir para o Dashboard
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-14 h-14 rounded-full bg-secondary-default flex items-center justify-center text-background text-2xl">
              !
            </div>
            <p className="font-poppins font-bold text-secondary-default text-lg m-0">{message}</p>
            <button
              onClick={() => navigate("/")}
              className="font-poppins text-textgray text-sm hover:text-primary-dark"
            >
              Voltar ao início
            </button>
          </>
        )}
      </div>
    </div>
  );
}

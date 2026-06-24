import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { ProfileAvatarEditor } from "../components/ProfileAvatarEditor";
import { useAuth } from "../context/AuthContext";

function AccountLoginMethods({
  hasPassword,
  hasGoogle,
}: {
  hasPassword?: boolean;
  hasGoogle?: boolean;
}) {
  if (!hasPassword && !hasGoogle) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-poppins text-[10px] uppercase tracking-wide text-bordergray">
        Forma de acesso
      </span>
      <div className="flex flex-col gap-1.5">
        {hasGoogle && (
          <span className="font-poppins text-sm text-textgray">Google</span>
        )}
        {hasPassword && (
          <span className="font-poppins text-sm text-textgray">E-mail e senha</span>
        )}
      </div>
    </div>
  );
}

export function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && !isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background page-fade-in">
      <Header compactUser />
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
            Personalize seu perfil e veja seus dados de acesso.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] gap-6 w-full items-stretch">
          <section className="bg-white rounded-card shadow-card p-6 sm:p-8 flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-1 pb-2 border-b border-bordergray/30">
              <h2 className="font-poppins font-bold text-lg text-primary-dark m-0">
                Perfil no chat
              </h2>
              <p className="font-poppins text-xs text-bordergray m-0">
                Escolha como os outros participantes te veem nas mensagens.
              </p>
            </div>

            {user && (
              <ProfileAvatarEditor username={user.username} avatarUrl={user.avatarUrl} />
            )}
          </section>

          <section className="bg-white rounded-card shadow-card p-6 sm:p-8 flex flex-col gap-5 h-full">
            <div className="flex flex-col gap-1 pb-2 border-b border-bordergray/30">
              <h2 className="font-poppins font-bold text-lg text-primary-dark m-0">Conta</h2>
              <p className="font-poppins text-xs text-bordergray m-0">Dados de acesso.</p>
            </div>

            <div className="rounded-compact bg-surface/70 px-4 py-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-poppins text-[10px] uppercase tracking-wide text-bordergray">
                  E-mail
                </span>
                <span className="font-poppins text-sm text-textgray break-all">{user?.email}</span>
              </div>

              <AccountLoginMethods
                hasPassword={user?.hasPassword}
                hasGoogle={user?.hasGoogle}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

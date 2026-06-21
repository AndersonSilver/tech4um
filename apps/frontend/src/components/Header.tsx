import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserInitial, resolveAvatarUrl } from "../utils/resolveAvatarUrl";
import logoLarge from "../assets/Logo-grande.png";
import btnEntrarAzul from "../assets/botao-entrar-azul.png";

interface HeaderProps {
  onLoginClick?: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const avatarSrc = resolveAvatarUrl(user?.avatarUrl);

  async function handleLogout() {
    await logout();
    navigate("/");
    setMenuOpen(false);
  }

  return (
    <header className="min-h-20 sm:h-24 w-full bg-background shadow-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 layout-page-x pt-4 sm:pt-6 pb-4">
      <div className="flex items-end gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="border-0 bg-transparent p-0 cursor-pointer shrink-0"
          aria-label="Tech4um — início"
        >
          <img src={logoLarge} alt="Tech4um" className="h-10 sm:h-14 w-auto object-contain" />
        </button>
        <p className="hidden md:block font-poppins font-extralight text-lg text-textgray leading-7 m-0 pb-1 truncate">
          Seu fórum sobre tecnologia!
        </p>
      </div>

      {isAuthenticated && user ? (
        <div className="relative flex items-center sm:items-end gap-3 self-end sm:self-auto">
          <div className="hidden sm:flex flex-col items-end text-textgray pb-1 min-w-0">
            <span className="font-poppins font-bold text-sm leading-normal">
              {user.username}
            </span>
            <span className="font-poppins font-normal text-[10px] leading-normal">
              {user.email}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="w-12 h-12 rounded-full overflow-hidden bg-bordergray border-0 p-0 cursor-pointer"
            aria-label="Menu do usuário"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-poppins text-sm text-background bg-primary-dark">
                {getUserInitial(user.username)}
              </span>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-button bg-white shadow-card py-2 z-20">
              <button
                type="button"
                onClick={() => {
                  navigate("/settings");
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left font-poppins text-xs text-textgray hover:bg-surface transition-colors"
              >
                Configurações
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left font-poppins text-xs text-secondary-default hover:bg-surface transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onLoginClick}
          className="mb-1 border-0 bg-transparent p-0 cursor-pointer transition-opacity hover:opacity-80"
          aria-label="Fazer login"
        >
          <img src={btnEntrarAzul} alt="Entrar" className="h-11 w-auto object-contain" />
        </button>
      )}
    </header>
  );
}

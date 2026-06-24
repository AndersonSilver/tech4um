import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserInitial, resolveAvatarUrl } from "../utils/resolveAvatarUrl";
import logoLarge from "../assets/Logo-grande.png";
import btnEntrarAzul from "../assets/botao-entrar-azul.png";

interface HeaderProps {
  onLoginClick?: () => void;
  /** Oculta nome e e-mail ao lado do avatar (ex.: página de configurações). */
  compactUser?: boolean;
}

export function Header({ onLoginClick, compactUser = false }: HeaderProps) {
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
    <header className="w-full bg-background shadow-header flex flex-row items-center justify-between gap-3 layout-page-x py-3 sm:py-6 min-h-[64px] sm:min-h-24">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="border-0 bg-transparent p-0 cursor-pointer shrink-0"
          aria-label="Tech4um — início"
        >
          <img
            src={logoLarge}
            alt="Tech4um"
            className="h-9 w-auto max-w-[140px] sm:h-14 sm:max-w-none object-contain object-left"
          />
        </button>
        <p className="hidden sm:block font-poppins font-extralight text-sm md:text-lg text-textgray leading-snug m-0 truncate">
          Seu fórum sobre tecnologia!
        </p>
      </div>

      {isAuthenticated && user ? (
        <div className="relative flex items-center gap-2 sm:gap-3 shrink-0">
          {!compactUser && (
            <div className="hidden md:flex flex-col items-end text-textgray min-w-0">
              <span className="font-poppins font-bold text-sm leading-normal">
                {user.username}
              </span>
              <span className="font-poppins font-normal text-[10px] leading-normal">
                {user.email}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-bordergray border-0 p-0 cursor-pointer shrink-0"
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
          className="border-0 bg-transparent p-0 cursor-pointer transition-opacity hover:opacity-80 shrink-0"
          aria-label="Fazer login"
        >
          <img src={btnEntrarAzul} alt="Entrar" className="h-9 sm:h-11 w-auto object-contain" />
        </button>
      )}
    </header>
  );
}

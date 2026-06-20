import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  onLoginClick?: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="h-24 w-full bg-background shadow-header flex items-end justify-between px-[189px] pt-6 pb-4">
      <div className="flex items-end gap-4">
        {/* Logo "4um tech" */}
        <div className="flex items-end gap-1 leading-none select-none">
          <span className="font-poppins font-extrabold text-3xl text-primary-default leading-none">
            4um
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-poppins font-light text-xs text-textgray -mb-1">tech</span>
          </div>
        </div>
        <p className="font-poppins font-extralight text-lg text-textgray leading-7 m-0">
          Seu fórum sobre tecnologia!
        </p>
      </div>

      {isAuthenticated && user ? (
        <div className="flex items-end gap-3">
          <div className="flex flex-col items-start text-textgray">
            <span className="font-poppins font-bold text-sm leading-normal">
              {user.username}
            </span>
            <span className="font-poppins font-normal text-[10px] leading-normal">
              {user.email}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden bg-bordergray">
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="font-poppins text-xs text-textgray hover:text-secondary-default transition-colors mb-3"
          >
            Sair
          </button>
        </div>
      ) : (
        <button
          onClick={onLoginClick}
          className="font-poppins font-normal text-base text-textgray hover:text-primary-dark transition-colors"
        >
          Fazer Login
        </button>
      )}
    </header>
  );
}

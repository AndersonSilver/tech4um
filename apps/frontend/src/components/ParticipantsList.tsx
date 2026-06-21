import { ForumParticipant } from "../types";
import { getUserInitial, resolveAvatarUrl } from "../utils/resolveAvatarUrl";

interface ParticipantsListProps {
  participants: ForumParticipant[];
  currentUserId?: string;
  activePrivateTo?: string | null;
  onSelectParticipant: (participant: ForumParticipant) => void;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2a8 8 0 00-6.32 12.9L2 18l3.1-1.68A8 8 0 1010 2z" />
    </svg>
  );
}

export function ParticipantsList({
  participants,
  currentUserId,
  activePrivateTo,
  onSelectParticipant,
}: ParticipantsListProps) {
  return (
    <aside className="bg-white rounded-card shadow-panel w-full lg:w-[250px] h-[200px] lg:h-full shrink-0 flex flex-col overflow-hidden self-stretch min-h-0">
      <div className="bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-center px-6 py-4 shrink-0 relative">
        <span className="font-poppins font-bold text-sm text-primary-dark">Participantes</span>
        <span className="absolute right-6 text-primary-dark">
          <SearchIcon />
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-6 overflow-y-auto flex-1 min-h-0">
        {participants.map((p) => {
          const isActive = activePrivateTo === p.userId;
          const username = p.user?.username ?? "Usuário";
          const isSelf = p.userId === currentUserId;
          const showPrivateHint = !isSelf;

          const avatarSrc = resolveAvatarUrl(p.user?.avatarUrl);
          const isOnline = p.userId === currentUserId || p.isOnline;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectParticipant(p)}
              className={`group relative flex items-center justify-between gap-2 rounded-bl-[25px] rounded-tl-[25px] rounded-br-2xl rounded-tr-2xl px-2 py-1.5 text-left transition-colors ${
                isActive ? "bg-black/5" : "hover:bg-black/5"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative h-8 w-8 shrink-0">
                  <div className="h-full w-full rounded-full bg-bordergray overflow-hidden">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-poppins text-[10px] text-background bg-primary-dark">
                        {getUserInitial(username)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      isOnline ? "bg-green-500" : "bg-bordergray"
                    }`}
                    aria-hidden
                  />
                </div>
                <span className="font-poppins font-medium text-xs text-textgray truncate">
                  {username}
                </span>
              </div>

              {showPrivateHint && (
                <span
                  className={`text-primary-default shrink-0 ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } transition-opacity`}
                >
                  <ChatBubbleIcon />
                </span>
              )}

              {showPrivateHint && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#4A4A4A] px-3 py-1.5 font-poppins text-[10px] text-white opacity-0 shadow-card transition-opacity group-hover:opacity-100"
                >
                  Enviar mensagem para {username}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

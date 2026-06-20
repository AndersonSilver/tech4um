import { ForumParticipant } from "../types";

interface ParticipantsListProps {
  participants: ForumParticipant[];
  activePrivateTo?: string | null;
  onSelectParticipant: (participant: ForumParticipant) => void;
}

export function ParticipantsList({
  participants,
  activePrivateTo,
  onSelectParticipant,
}: ParticipantsListProps) {
  const onlineCount = participants.filter((p) => p.isOnline).length;

  return (
    <aside className="bg-background rounded-card shadow-panel w-[250px] h-full overflow-hidden">
      <div className="bg-background shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-between px-6 py-4">
        <div className="flex flex-col">
          <span className="font-poppins font-bold text-sm text-primary-dark">Participantes</span>
          <span className="font-poppins text-[10px] text-green-600">{onlineCount} online</span>
        </div>
        <span className="text-textgray">🔍</span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-6 overflow-y-auto max-h-[700px]">
        {participants.map((p) => {
          const isActive = activePrivateTo === p.userId;
          return (
            <button
              key={p.id}
              onClick={() => onSelectParticipant(p)}
              className={`flex items-center justify-between gap-2 rounded-bl-[25px] rounded-tl-[25px] rounded-br-2xl rounded-tr-2xl px-1 py-1 text-left transition-colors ${
                isActive ? "bg-black/5" : "hover:bg-black/5"
              }`}
              title={`Enviar mensagem para ${p.user.username}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-bordergray overflow-hidden relative shrink-0">
                  {p.user.avatarUrl && (
                    <img
                      src={p.user.avatarUrl}
                      alt={p.user.username}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span
                    className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-background ${
                      p.isOnline ? "bg-green-500" : "bg-bordergray"
                    }`}
                  />
                </div>
                <span className="font-poppins font-medium text-xs text-textgray">
                  {p.user.username}
                </span>
              </div>
              {isActive && <span className="text-primary-dark text-xs">💬</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

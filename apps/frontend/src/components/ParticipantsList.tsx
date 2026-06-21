import { useMemo, useState } from "react";
import { ForumParticipant } from "../types";
import { getUserInitial, resolveAvatarUrl } from "../utils/resolveAvatarUrl";

interface ParticipantsListProps {
  participants: ForumParticipant[];
  currentUserId?: string;
  activePrivateTo?: string | null;
  onSelectParticipant: (participant: ForumParticipant) => void;
  onClose?: () => void;
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M5 5L13 13M13 5L5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatBubbleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2a8 8 0 00-6.32 12.9L2 18l3.1-1.68A8 8 0 1010 2z" />
    </svg>
  );
}

function sortParticipants(
  participants: ForumParticipant[],
  currentUserId?: string
): ForumParticipant[] {
  return [...participants].sort((a, b) => {
    const aOnline = a.userId === currentUserId || a.isOnline;
    const bOnline = b.userId === currentUserId || b.isOnline;
    if (aOnline !== bOnline) return aOnline ? -1 : 1;

    const aName = a.user?.username ?? "";
    const bName = b.user?.username ?? "";
    return aName.localeCompare(bName, "pt-BR", { sensitivity: "base" });
  });
}

function ParticipantRow({
  participant,
  currentUserId,
  activePrivateTo,
  onSelectParticipant,
  onAfterSelect,
}: {
  participant: ForumParticipant;
  currentUserId?: string;
  activePrivateTo?: string | null;
  onSelectParticipant: (participant: ForumParticipant) => void;
  onAfterSelect?: () => void;
}) {
  const isActive = activePrivateTo === participant.userId;
  const username = participant.user?.username ?? "Usuário";
  const isSelf = participant.userId === currentUserId;
  const avatarSrc = resolveAvatarUrl(participant.user?.avatarUrl);
  const isOnline = participant.userId === currentUserId || participant.isOnline;

  return (
    <button
      type="button"
      onClick={() => {
        onSelectParticipant(participant);
        if (!isSelf) onAfterSelect?.();
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-bordergray/25 last:border-b-0 ${
        isActive ? "bg-primary-dark/5" : "hover:bg-surface"
      }`}
    >
      <div className="relative h-10 w-10 shrink-0">
        <div className="h-full w-full rounded-full bg-bordergray overflow-hidden">
          {avatarSrc ? (
            <img src={avatarSrc} alt={username} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-poppins text-xs text-background bg-primary-dark">
              {getUserInitial(username)}
            </span>
          )}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-bordergray"
          }`}
          aria-hidden
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-poppins font-semibold text-sm text-textgray truncate m-0">
          {username}
          {isSelf && <span className="font-normal text-bordergray"> · você</span>}
        </p>
        <p className="font-poppins text-[10px] text-bordergray m-0 mt-0.5">
          {isOnline ? "Online agora" : "Offline"}
        </p>
      </div>

      {!isSelf && (
        <span
          className={`shrink-0 rounded-full p-2 transition-colors ${
            isActive
              ? "bg-primary-dark text-background"
              : "bg-surface text-primary-default"
          }`}
          aria-hidden
        >
          <ChatBubbleIcon />
        </span>
      )}
    </button>
  );
}

function ParticipantsPanel({
  participants,
  currentUserId,
  activePrivateTo,
  onSelectParticipant,
  onClose,
}: ParticipantsListProps) {
  const [query, setQuery] = useState("");

  const onlineCount = participants.filter(
    (participant) => participant.isOnline || participant.userId === currentUserId
  ).length;

  const filtered = useMemo(() => {
    const sorted = sortParticipants(participants, currentUserId);
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return sorted;

    return sorted.filter((participant) =>
      (participant.user?.username ?? "").toLowerCase().includes(normalizedQuery)
    );
  }, [participants, currentUserId, query]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="shrink-0 px-4 py-4 border-b border-bordergray/30">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-poppins font-bold text-base text-primary-dark m-0">
              Participantes
            </h2>
            <p className="font-poppins text-xs text-textgray m-0 mt-1">
              {onlineCount} online · {participants.length} no total
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar participantes"
              className="lg:hidden shrink-0 h-9 w-9 rounded-full border border-bordergray text-textgray flex items-center justify-center hover:border-primary-dark/40 transition-colors"
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <label className="mt-3 flex items-center gap-2 rounded-search border border-bordergray px-3 h-9">
          <span className="text-bordergray text-xs" aria-hidden>
            ⌕
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar participante..."
            className="w-full min-w-0 border-0 bg-transparent outline-none font-poppins text-xs text-textgray placeholder:text-bordergray"
          />
        </label>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 font-poppins text-xs text-bordergray m-0">
            Nenhum participante encontrado.
          </p>
        ) : (
          filtered.map((participant) => (
            <ParticipantRow
              key={participant.id}
              participant={participant}
              currentUserId={currentUserId}
              activePrivateTo={activePrivateTo}
              onSelectParticipant={onSelectParticipant}
              onAfterSelect={onClose}
            />
          ))
        )}
      </div>

      <div className="shrink-0 px-4 py-3 border-t border-bordergray/30 bg-surface/80">
        <p className="font-poppins text-[10px] text-textgray m-0">
          Toque em um participante para enviar mensagem privada.
        </p>
      </div>
    </div>
  );
}

export function ParticipantsList(props: ParticipantsListProps) {
  const { onClose } = props;

  return (
    <>
      {onClose && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          aria-label="Fechar participantes"
          onClick={onClose}
        />
      )}

      <aside className="fixed inset-x-0 bottom-0 z-40 max-h-[72dvh] rounded-t-card shadow-panel overflow-hidden animate-[slideUp_0.25s_ease-out] lg:static lg:z-auto lg:w-[250px] lg:max-h-none lg:h-full lg:rounded-card lg:shadow-panel lg:shrink-0 lg:flex lg:flex-col">
        <div className="lg:hidden flex justify-center pt-3 pb-1 bg-white shrink-0">
          <span className="h-1 w-10 rounded-full bg-bordergray/80" aria-hidden />
        </div>
        <ParticipantsPanel {...props} />
      </aside>
    </>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { ParticipantsList } from "../components/ParticipantsList";
import { MessageBubble } from "../components/MessageBubble";
import { ForumCarousel } from "../components/ForumCarousel";
import { ChatMessageComposer, uploadForumImage } from "../components/ChatMessageComposer";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { Forum, ForumParticipant, Message } from "../types";
import { SOCKET_EVENTS } from "@tech4um/shared";
import { buildSenderProfileIndex } from "../utils/senderProfiles";

const TYPING_HIDE_DELAY_MS = 1000;

function ParticipantsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="7" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.5 16.5C2.5 13.9 4.5 12 7 12C9.5 12 11.5 13.9 11.5 16.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="13.5" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M11 16.5C11.2 14.4 12.7 13 14.8 13C16.4 13 17.7 13.9 18.2 15.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const socket = useSocket();

  const [forum, setForum] = useState<Forum | null>(null);
  const [allForums, setAllForums] = useState<Forum[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [privateTarget, setPrivateTarget] = useState<ForumParticipant | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [hasNewPrivateMessage, setHasNewPrivateMessage] = useState(false);
  const [isForumJoined, setIsForumJoined] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef(user?.id);

  const loadForum = useCallback(async (forumId: string) => {
    const { data } = await api.get<Forum>(`/forums/${forumId}`);
    setForum(data);
  }, []);

  const loadAllForums = useCallback(async () => {
    const { data } = await api.get<Forum[]>("/forums");
    setAllForums(data);
  }, []);

  const loadMessages = useCallback(async (forumId: string) => {
    const { data } = await api.get<Message[]>(`/forums/${forumId}/messages`);
    setMessages(data);
  }, []);

  const loadForumRef = useRef(loadForum);
  const loadAllForumsRef = useRef(loadAllForums);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    loadForumRef.current = loadForum;
    loadAllForumsRef.current = loadAllForums;
  }, [loadForum, loadAllForums]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !id) return;
    setMessages([]);
    setContent("");
    setPrivateTarget(null);
    loadForum(id);
    loadMessages(id);
    void loadAllForums();
    void api.post(`/forums/${id}/join`).catch(() => undefined);
  }, [id, isLoading, isAuthenticated, loadForum, loadMessages, loadAllForums]);

  useEffect(() => {
    if (!socket || !id) return;

    let active = true;
    setIsForumJoined(false);

    const joinForum = () => {
      socket.emit(SOCKET_EVENTS.JOIN_FORUM, { forumId: id });
    };

    const onForumJoined = ({ forumId }: { forumId: string }) => {
      if (!active || forumId !== id) return;
      setIsForumJoined(true);
      void loadForumRef.current(id);
    };

    joinForum();

    socket.on("connect", joinForum);
    socket.on(SOCKET_EVENTS.FORUM_JOINED, onForumJoined);

    socket.on(SOCKET_EVENTS.NEW_PUBLIC_MESSAGE, ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on(SOCKET_EVENTS.NEW_PRIVATE_MESSAGE, ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== userIdRef.current) {
        setHasNewPrivateMessage(true);
        setTimeout(() => setHasNewPrivateMessage(false), 4000);
      }
    });

    socket.on(SOCKET_EVENTS.SYSTEM_NOTICE, ({ message }: { message: string }) => {
      setSystemNotice(message);
      setTimeout(() => setSystemNotice(null), 3000);
    });

    socket.on(SOCKET_EVENTS.USER_TYPING, ({ username }: { username: string }) => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      setTypingUser(username);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUser(null);
        typingTimeoutRef.current = null;
      }, TYPING_HIDE_DELAY_MS);
    });

    socket.on(SOCKET_EVENTS.PARTICIPANT_ONLINE, () => {
      void loadForumRef.current(id);
    });
    socket.on(SOCKET_EVENTS.PARTICIPANT_OFFLINE, () => {
      void loadForumRef.current(id);
    });

    socket.on(SOCKET_EVENTS.FORUM_PRESENCE_UPDATED, () => {
      void loadAllForumsRef.current();
      void loadForumRef.current(id);
    });

    socket.on(
      SOCKET_EVENTS.MESSAGE_REACTION_UPDATED,
      ({
        messageId,
        reactions,
      }: {
        messageId: string;
        reactions: Message["reactions"];
      }) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, reactions } : message
          )
        );
      }
    );

    return () => {
      active = false;
      setIsForumJoined(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      socket.off("connect", joinForum);
      socket.emit(SOCKET_EVENTS.LEAVE_FORUM, { forumId: id });
      socket.off(SOCKET_EVENTS.FORUM_JOINED, onForumJoined);
      socket.off(SOCKET_EVENTS.NEW_PUBLIC_MESSAGE);
      socket.off(SOCKET_EVENTS.NEW_PRIVATE_MESSAGE);
      socket.off(SOCKET_EVENTS.USER_TYPING);
      socket.off(SOCKET_EVENTS.PARTICIPANT_OFFLINE);
      socket.off(SOCKET_EVENTS.PARTICIPANT_ONLINE);
      socket.off(SOCKET_EVENTS.FORUM_PRESENCE_UPDATED);
      socket.off(SOCKET_EVENTS.SYSTEM_NOTICE);
      socket.off(SOCKET_EVENTS.MESSAGE_REACTION_UPDATED);
    };
  }, [socket, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = content.trim();
    if ((!text && !pendingImageUrl) || !socket || !id || isUploadingImage || !isForumJoined) return;

    const payload = {
      forumId: id,
      content: text,
      imageUrl: pendingImageUrl ?? undefined,
    };

    if (privateTarget) {
      socket.emit(SOCKET_EVENTS.SEND_PRIVATE_MESSAGE, {
        ...payload,
        recipientId: privateTarget.userId,
      });
    } else {
      socket.emit(SOCKET_EVENTS.SEND_PUBLIC_MESSAGE, payload);
    }

    setContent("");
    setPendingImageUrl(null);
    setPendingImagePreview(null);
  }

  function showNotice(message: string) {
    setSystemNotice(message);
    setTimeout(() => setSystemNotice(null), 4000);
  }

  async function handleImageSelected(file: File) {
    if (!id) return;

    const preview = URL.createObjectURL(file);
    setPendingImagePreview(preview);
    setIsUploadingImage(true);

    try {
      const imageUrl = await uploadForumImage(id, file);
      setPendingImageUrl(imageUrl);
    } catch (error) {
      const apiMessage =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message === "string"
          ? (error as { response: { data: { message: string } } }).response.data.message
          : null;

      showNotice(apiMessage ?? "Não foi possível anexar a imagem.");
      URL.revokeObjectURL(preview);
      setPendingImagePreview(null);
      setPendingImageUrl(null);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleRemovePendingImage() {
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setPendingImagePreview(null);
    setPendingImageUrl(null);
  }

  function handleTyping() {
    if (!socket || !id || !isForumJoined) return;
    socket.emit(SOCKET_EVENTS.TYPING, { forumId: id });
  }

  function handleReact(messageId: string, emoji: string) {
    if (!socket || !id || !isForumJoined) return;
    socket.emit(SOCKET_EVENTS.REACT_TO_MESSAGE, {
      forumId: id,
      messageId,
      emoji,
    });
  }

  const senderProfiles = useMemo(
    () =>
      buildSenderProfileIndex({
        currentUser: user,
        participants: forum?.participants,
        messages,
      }),
    [user, forum?.participants, messages]
  );

  if (!isLoading && !isAuthenticated) {
    navigate("/");
    return null;
  }

  if (isLoading || !forum) return null;

  const participantNames = new Map(
    (forum.participants ?? []).map((participant) => [
      participant.userId,
      participant.user?.username,
    ])
  );

  function resolveSenderName(message: Message) {
    return (
      message.sender?.username ??
      participantNames.get(message.senderId) ??
      (message.senderId === user?.id ? user?.username : undefined)
    );
  }

  const isPrivateMode = Boolean(privateTarget);

  const onlineParticipantCount = (forum.participants ?? []).filter(
    (participant) => participant.isOnline || participant.userId === user?.id
  ).length;

  return (
    <div className="h-[100dvh] bg-background page-fade-in flex flex-col overflow-hidden">
      <Header />

      <main className="layout-page-x pt-3 sm:pt-6 pb-3 sm:pb-4 flex flex-col gap-3 min-h-0 flex-1">
        <div className="flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-textgray font-poppins border-0 bg-transparent p-0 cursor-pointer text-sm sm:text-base min-w-0"
          >
            <span>←</span>
            <span className="truncate">Voltar para o dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setShowParticipants(true)}
            aria-label="Ver participantes"
            aria-expanded={showParticipants}
            className={`lg:hidden relative h-10 w-10 rounded-button border flex items-center justify-center transition-colors shrink-0 ${
              showParticipants
                ? "border-primary-dark bg-white text-primary-dark shadow-compact"
                : "border-bordergray bg-white text-textgray hover:border-primary-dark/40"
            }`}
          >
            <ParticipantsIcon />
            {onlineParticipantCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-dark text-background font-poppins text-[10px] font-semibold flex items-center justify-center">
                {onlineParticipantCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-5 items-stretch lg:h-[819px] relative min-h-0 flex-1">
          {systemNotice && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary-dark text-background font-poppins text-xs px-4 py-2 rounded-full shadow-card z-10 animate-pulse">
              {systemNotice}
            </div>
          )}

          {showParticipants && (
            <ParticipantsList
              participants={forum.participants ?? []}
              currentUserId={user?.id}
              activePrivateTo={privateTarget?.userId ?? null}
              onSelectParticipant={(p) =>
                setPrivateTarget(p.userId === user?.id ? null : p)
              }
              onClose={() => setShowParticipants(false)}
            />
          )}

          <section className="bg-white rounded-card shadow-panel flex-1 min-w-0 min-h-0 relative overflow-hidden flex flex-col order-2 lg:order-none">
            <header className="bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 shrink-0 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowParticipants((prev) => !prev)}
                  title={showParticipants ? "Ocultar participantes" : "Mostrar participantes"}
                  className="hidden lg:block text-textgray hover:text-primary-dark transition-colors border-0 bg-transparent p-0 cursor-pointer shrink-0 text-sm"
                >
                  {showParticipants ? "⟨⟨" : "⟩⟩"}
                </button>
                <span className="font-poppins font-bold text-base sm:text-xl text-primary-dark truncate">
                  {forum.name}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {hasNewPrivateMessage && (
                  <span className="font-poppins text-[10px] bg-secondary-default text-background px-2 py-1 rounded-full animate-bounce">
                    Nova mensagem privada
                  </span>
                )}
                <div className="hidden sm:flex gap-1 text-sm">
                  <span className="font-poppins font-light text-primary-dark">Criado por:</span>
                  <span className="font-poppins font-semibold text-primary-dark">
                    {forum.owner?.username ?? "Anônimo"}
                  </span>
                </div>
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-4 sm:py-6 flex flex-col gap-4 sm:gap-6 bg-white">
              {messages
                .filter(
                  (m) =>
                    m.type === "public" ||
                    m.senderId === user?.id ||
                    m.recipientId === user?.id
                )
                .map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user?.id}
                    senderName={resolveSenderName(message)}
                    senderAvatarUrl={senderProfiles.get(message.senderId)?.avatarUrl}
                    currentUserId={user?.id}
                    onReact={handleReact}
                  />
                ))}
              <div ref={messagesEndRef} />
            </div>

            {typingUser && (
              <p className="font-poppins italic text-[10px] text-textgray px-8 pb-2 m-0 bg-white shrink-0">
                {typingUser} está digitando...
              </p>
            )}

            {!isForumJoined && (
              <p className="font-poppins text-[10px] text-bordergray px-4 sm:px-8 pb-2 m-0 bg-white shrink-0">
                Conectando à sala...
              </p>
            )}

            <ChatMessageComposer
              content={content}
              isPrivateMode={isPrivateMode}
              recipientName={privateTarget?.user?.username}
              pendingImageUrl={pendingImagePreview}
              isUploading={isUploadingImage || !isForumJoined}
              onContentChange={setContent}
              onTyping={handleTyping}
              onSend={handleSend}
              onCancelPrivate={() => setPrivateTarget(null)}
              onImageSelected={handleImageSelected}
              onImageRejected={showNotice}
              onRemovePendingImage={handleRemovePendingImage}
            />
          </section>

          <div className="order-3 lg:order-none shrink-0 lg:self-stretch min-h-0">
            <ForumCarousel
              forums={allForums}
              activeForumId={forum.id}
              onSelect={async (selectedForum) => {
                await api.post(`/forums/${selectedForum.id}/join`);
                navigate(`/forums/${selectedForum.id}`);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
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

const TYPING_HIDE_DELAY_MS = 1000;

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
  const [showParticipants, setShowParticipants] = useState(true);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [hasNewPrivateMessage, setHasNewPrivateMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (isLoading || !isAuthenticated || !id) return;
    loadForum(id);
    loadMessages(id);
    void loadAllForums();
  }, [id, isLoading, isAuthenticated, loadForum, loadMessages, loadAllForums]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit(SOCKET_EVENTS.JOIN_FORUM, { forumId: id });

    socket.on(SOCKET_EVENTS.FORUM_JOINED, () => {
      loadForum(id);
    });

    socket.on(SOCKET_EVENTS.NEW_PUBLIC_MESSAGE, ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on(SOCKET_EVENTS.NEW_PRIVATE_MESSAGE, ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== user?.id) {
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

    socket.on(SOCKET_EVENTS.PARTICIPANT_ONLINE, () => loadForum(id));
    socket.on(SOCKET_EVENTS.PARTICIPANT_OFFLINE, () => loadForum(id));

    socket.on(SOCKET_EVENTS.FORUM_PRESENCE_UPDATED, () => {
      void loadAllForums();
      void loadForum(id);
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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      socket.emit(SOCKET_EVENTS.LEAVE_FORUM, { forumId: id });
      socket.off(SOCKET_EVENTS.FORUM_JOINED);
      socket.off(SOCKET_EVENTS.NEW_PUBLIC_MESSAGE);
      socket.off(SOCKET_EVENTS.NEW_PRIVATE_MESSAGE);
      socket.off(SOCKET_EVENTS.USER_TYPING);
      socket.off(SOCKET_EVENTS.PARTICIPANT_OFFLINE);
      socket.off(SOCKET_EVENTS.PARTICIPANT_ONLINE);
      socket.off(SOCKET_EVENTS.FORUM_PRESENCE_UPDATED);
      socket.off(SOCKET_EVENTS.SYSTEM_NOTICE);
      socket.off(SOCKET_EVENTS.MESSAGE_REACTION_UPDATED);
    };
  }, [socket, id, user?.id, loadForum, loadAllForums]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = content.trim();
    if ((!text && !pendingImageUrl) || !socket || !id || isUploadingImage) return;

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
    if (!socket || !id) return;
    socket.emit(SOCKET_EVENTS.TYPING, { forumId: id });
  }

  function handleReact(messageId: string, emoji: string) {
    if (!socket || !id) return;
    socket.emit(SOCKET_EVENTS.REACT_TO_MESSAGE, {
      forumId: id,
      messageId,
      emoji,
    });
  }

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

  return (
    <div className="min-h-screen bg-background page-fade-in">
      <Header />

      <main className="layout-page-x pt-8 pb-12 flex flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-textgray font-poppins border-0 bg-transparent p-0 cursor-pointer"
        >
          <span>←</span>
          <span className="text-base">Voltar para o dashboard</span>
        </button>

        {/* Desktop: 3 colunas fixas 819px (Figma). Mobile: empilha sem esticar o painel. */}
        <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:h-[819px] relative min-h-0">
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
            />
          )}

          <section className="bg-white rounded-card shadow-panel flex-1 min-w-0 h-[min(70vh,640px)] lg:h-full min-h-0 relative overflow-hidden flex flex-col">
            <header className="bg-white shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-between px-8 py-5 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowParticipants((prev) => !prev)}
                  title={showParticipants ? "Ocultar participantes" : "Mostrar participantes"}
                  className="text-textgray hover:text-primary-dark transition-colors border-0 bg-transparent p-0 cursor-pointer shrink-0"
                >
                  {showParticipants ? "⟨⟨" : "⟩⟩"}
                </button>
                <span className="font-poppins font-bold text-xl text-primary-dark truncate">
                  {forum.name}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {hasNewPrivateMessage && (
                  <span className="font-poppins text-[10px] bg-secondary-default text-background px-2 py-1 rounded-full animate-bounce">
                    Nova mensagem privada
                  </span>
                )}
                <div className="flex gap-1 text-sm">
                  <span className="font-poppins font-light text-primary-dark">Criado por:</span>
                  <span className="font-poppins font-semibold text-primary-dark">
                    {forum.owner?.username ?? "Anônimo"}
                  </span>
                </div>
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 flex flex-col gap-6 bg-white">
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

            <ChatMessageComposer
              content={content}
              isPrivateMode={isPrivateMode}
              recipientName={privateTarget?.user?.username}
              pendingImageUrl={pendingImagePreview}
              isUploading={isUploadingImage}
              onContentChange={setContent}
              onTyping={handleTyping}
              onSend={handleSend}
              onCancelPrivate={() => setPrivateTarget(null)}
              onImageSelected={handleImageSelected}
              onImageRejected={showNotice}
              onRemovePendingImage={handleRemovePendingImage}
            />
          </section>

          <ForumCarousel
            forums={allForums}
            activeForumId={forum.id}
            onSelect={(f) => navigate(`/forums/${f.id}`)}
          />
        </div>
      </main>
    </div>
  );
}

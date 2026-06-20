import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { ParticipantsList } from "../components/ParticipantsList";
import { MessageBubble } from "../components/MessageBubble";
import { ForumCarousel } from "../components/ForumCarousel";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { Forum, ForumParticipant, Message } from "../types";

export function ChatRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [forum, setForum] = useState<Forum | null>(null);
  const [allForums, setAllForums] = useState<Forum[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [privateTarget, setPrivateTarget] = useState<ForumParticipant | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(true);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);
  const [hasNewPrivateMessage, setHasNewPrivateMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    loadForum(id);
    loadMessages(id);
    api.get<Forum[]>("/forums").then((res) => setAllForums(res.data));
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("join_forum", { forumId: id });

    socket.on("new_public_message", ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("new_private_message", ({ message }: { message: Message }) => {
      setMessages((prev) => [...prev, message]);
      if (message.senderId !== user?.id) {
        setHasNewPrivateMessage(true);
        setTimeout(() => setHasNewPrivateMessage(false), 4000);
      }
    });

    socket.on("system_notice", ({ message }: { message: string }) => {
      setSystemNotice(message);
      setTimeout(() => setSystemNotice(null), 3000);
    });

    socket.on("user_typing", ({ username }: { username: string }) => {
      setTypingUser(username);
      setTimeout(() => setTypingUser(null), 2000);
    });

    socket.on("participant_online", () => loadForum(id));
    socket.on("participant_offline", () => loadForum(id));

    return () => {
      socket.emit("leave_forum", { forumId: id });
      socket.off("new_public_message");
      socket.off("new_private_message");
      socket.off("user_typing");
      socket.off("participant_online");
      socket.off("participant_offline");
      socket.off("system_notice");
    };
  }, [socket, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadForum(forumId: string) {
    const { data } = await api.get<Forum>(`/forums/${forumId}`);
    setForum(data);
  }

  async function loadMessages(forumId: string) {
    const { data } = await api.get<Message[]>(`/forums/${forumId}/messages`);
    setMessages(data);
  }

  function handleSend() {
    if (!content.trim() || !socket || !id) return;

    if (privateTarget) {
      socket.emit("send_private_message", {
        forumId: id,
        recipientId: privateTarget.userId,
        content,
      });
    } else {
      socket.emit("send_public_message", { forumId: id, content });
    }
    setContent("");
  }

  function handleTyping() {
    if (!socket || !id) return;
    socket.emit("typing", { forumId: id });
  }

  if (!forum) return null;

  const otherForums = allForums.filter((f) => f.id !== forum.id);

  return (
    <div className="min-h-screen bg-background page-fade-in">
      <Header />

      <main className="px-[102px] pt-8 flex flex-col gap-2">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-textgray font-poppins"
        >
          <span>←</span>
          <span className="text-base">Voltar para o dashboard</span>
        </button>

        <div className="flex gap-5 items-start h-[819px] relative">
          {systemNotice && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary-dark text-background font-poppins text-xs px-4 py-2 rounded-full shadow-card z-10 animate-pulse">
              {systemNotice}
            </div>
          )}

          {showParticipants && (
            <ParticipantsList
              participants={forum.participants ?? []}
              activePrivateTo={privateTarget?.userId ?? null}
              onSelectParticipant={(p) =>
                setPrivateTarget(p.userId === user?.id ? null : p)
              }
            />
          )}

          <section className="bg-background rounded-card shadow-panel w-[792px] h-full relative overflow-hidden flex flex-col">
            <header className="bg-background shadow-[0px_2px_4px_0px_rgba(0,0,0,0.08)] flex items-center justify-between px-6 py-4 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowParticipants((prev) => !prev)}
                  title={showParticipants ? "Ocultar participantes" : "Mostrar participantes"}
                  className="text-textgray hover:text-primary-dark transition-colors"
                >
                  {showParticipants ? "⟨⟨" : "⟩⟩"}
                </button>
                <span className="font-poppins font-bold text-lg text-primary-dark">
                  {forum.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
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

            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
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
                  />
                ))}
              <div ref={messagesEndRef} />
            </div>

            {typingUser && (
              <p className="font-poppins text-[10px] text-textgray px-8 pb-1 m-0">
                {typingUser} está digitando...
              </p>
            )}

            <div className="bg-primary-dark flex flex-col gap-4 items-center p-6 shrink-0">
              <div className="flex items-center justify-between w-full">
                <p className="font-poppins font-bold text-[10px] text-background m-0">
                  {privateTarget
                    ? `Enviando para ${privateTarget.user.username}`
                    : "Enviando para todos do 4um"}
                </p>
                {privateTarget && (
                  <button
                    onClick={() => setPrivateTarget(null)}
                    className="font-poppins text-[10px] text-background underline"
                  >
                    Cancelar envio de mensagem privada
                  </button>
                )}
              </div>
              <div className="bg-white flex gap-2.5 items-center p-4 rounded-card w-full">
                <input
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Escreva aqui uma mensagem maneira para mandar para os colegas..."
                  className="flex-1 outline-none font-poppins font-light text-xs text-textgray bg-transparent"
                />
                <button onClick={handleSend} className="text-primary-dark">
                  ➤
                </button>
              </div>
            </div>
          </section>

          <ForumCarousel
            forums={otherForums}
            activeForumId={forum.id}
            onSelect={(f) => navigate(`/forums/${f.id}`)}
          />
        </div>
      </main>
    </div>
  );
}

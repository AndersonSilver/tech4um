import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { LoginModal } from "../components/LoginModal";
import { CreateForumModal } from "../components/CreateForumModal";
import { ForumCard } from "../components/ForumCard";
import { ForumSortToggle } from "../components/ForumSortToggle";
import { SearchBar } from "../components/SearchBar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { Forum } from "../types";
import { ForumSortMode, sortForums } from "../utils/forumMetrics";
import { SOCKET_EVENTS } from "@tech4um/shared";

type CardSize = "extra-large" | "large" | "medium" | "small";

interface CardLayout {
  size: CardSize;
  featured: boolean;
  colSpan: string;
}

const CARD_LAYOUT_PATTERN: CardLayout[] = [
  { size: "extra-large", featured: true, colSpan: "col-span-1 xl:col-span-2" },
  { size: "medium", featured: false, colSpan: "col-span-1" },
  { size: "medium", featured: false, colSpan: "col-span-1" },
  { size: "large", featured: true, colSpan: "col-span-1 xl:col-span-2" },
  { size: "small", featured: false, colSpan: "col-span-1" },
  { size: "medium", featured: false, colSpan: "col-span-1" },
  { size: "small", featured: false, colSpan: "col-span-1" },
];

const FORUM_REFRESH_MS = 20_000;

function getCardLayout(index: number): CardLayout {
  return CARD_LAYOUT_PATTERN[index % CARD_LAYOUT_PATTERN.length];
}

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [forums, setForums] = useState<Forum[]>([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<ForumSortMode>("recent");
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    void loadForums();
    const timer = window.setInterval(() => {
      void loadForums();
    }, FORUM_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refreshForums = () => {
      void loadForums();
    };

    socket.on(SOCKET_EVENTS.FORUM_PRESENCE_UPDATED, refreshForums);
    return () => {
      socket.off(SOCKET_EVENTS.FORUM_PRESENCE_UPDATED, refreshForums);
    };
  }, [socket]);

  async function loadForums() {
    const { data } = await api.get<Forum[]>("/forums");
    setForums(data);
  }

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    action();
  }

  async function handleCreateForum(name: string, description?: string) {
    const { data } = await api.post<Forum>("/forums", { name, description });
    setForums((prev) => [data, ...prev]);
  }

  async function handleEnterForum(forum: Forum) {
    await api.post(`/forums/${forum.id}/join`);
    navigate(`/forums/${forum.id}`);
  }

  const filtered = sortForums(
    forums.filter((forum) => forum.name.toLowerCase().includes(search.toLowerCase())),
    sortMode
  );

  return (
    <div className="min-h-screen bg-background page-fade-in">
      <Header onLoginClick={() => setShowLogin(true)} />

      <main className="layout-page-x pt-6 sm:pt-10 pb-16 sm:pb-24 flex flex-col gap-6 sm:gap-8">
        <div className="text-textgray">
          <p className="font-poppins font-light text-2xl sm:text-[32px] m-0 leading-8">Opa!</p>
          <p className="font-poppins font-bold text-lg sm:text-xl m-0 leading-8 mt-1">
            Sobre o que gostaria de falar hoje?
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-[18px] lg:items-center w-full">
            <SearchBar value={search} onChange={setSearch} />
            <button
              type="button"
              onClick={() => requireAuth(() => setShowCreate(true))}
              className="bg-primary-dark h-11 px-5 rounded-button font-poppins font-semibold text-sm sm:text-base text-background whitespace-nowrap shrink-0 hover:brightness-110 transition-all w-full lg:w-auto"
            >
              Ou crie seu próprio 4um
            </button>
          </div>
          <ForumSortToggle value={sortMode} onChange={setSortMode} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 w-full">
          {filtered.map((forum, index) => {
            const layout = getCardLayout(index);
            return (
              <div key={forum.id} className={layout.colSpan}>
                <ForumCard
                  forum={forum}
                  size={layout.size}
                  featured={layout.featured}
                  onClick={() => requireAuth(() => void handleEnterForum(forum))}
                />
              </div>
            );
          })}
        </div>
      </main>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
      )}
      {showCreate && (
        <CreateForumModal onClose={() => setShowCreate(false)} onCreate={handleCreateForum} />
      )}
    </div>
  );
}

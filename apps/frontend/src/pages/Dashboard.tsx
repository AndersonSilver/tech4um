import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { LoginModal } from "../components/LoginModal";
import { CreateForumModal } from "../components/CreateForumModal";
import { ForumCard } from "../components/ForumCard";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { Forum } from "../types";

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [forums, setForums] = useState<Forum[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [showLogin, setShowLogin] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadForums();
  }, []);

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

  const filtered = forums
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "popular") {
        return (b.participants?.length ?? 0) - (a.participants?.length ?? 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Distribui os fóruns nas colunas esquerda/direita, alternando tamanhos
  const left = filtered.filter((_, i) => i % 2 === 0);
  const right = filtered.filter((_, i) => i % 2 !== 0);

  return (
    <div className="min-h-screen bg-background page-fade-in">
      <Header onLoginClick={() => setShowLogin(true)} />

      <main className="px-[189px] pt-10 pb-24 flex flex-col gap-8">
        <div className="text-textgray">
          <p className="font-poppins font-light text-3xl m-0 leading-8">Opa!</p>
          <p className="font-poppins font-bold text-xl m-0 leading-8">
            Sobre o que gostaria de falar hoje?
          </p>
        </div>

        <div className="flex gap-[18px] items-start w-full max-w-[1062px]">
          <div className="flex-1 h-11 bg-background border border-primary-dark rounded-button flex items-center justify-between pl-6 pr-1.5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Em busca de uma sala? Encontre-a aqui"
              className="bg-transparent outline-none font-poppins font-light text-sm text-bordergray flex-1"
            />
            <button className="bg-primary-dark h-11 px-4 rounded-button text-background font-bold">
              →
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "popular")}
            className="h-11 px-4 rounded-button border border-bordergray bg-background font-poppins text-sm text-textgray outline-none"
          >
            <option value="recent">Mais recentes</option>
            <option value="popular">Mais populares</option>
          </select>
          <button
            onClick={() => requireAuth(() => setShowCreate(true))}
            className="bg-primary-dark h-11 px-4 rounded-button font-poppins font-semibold text-base text-background whitespace-nowrap"
          >
            Ou crie seu próprio 4um
          </button>
        </div>

        <div className="flex gap-5 items-start w-full">
          <div className="flex flex-col gap-6 flex-1">
            {left.map((forum, idx) => (
              <ForumCard
                key={forum.id}
                forum={forum}
                size={idx === 0 ? "extra-large" : idx % 2 === 0 ? "medium" : "small"}
                featured={idx === 0}
                onClick={() => handleEnterForum(forum)}
              />
            ))}
          </div>
          <div className="flex flex-col gap-6 flex-1">
            {right.map((forum, idx) => (
              <ForumCard
                key={forum.id}
                forum={forum}
                size={idx % 3 === 1 ? "large" : "medium"}
                featured={idx % 3 === 1}
                onClick={() => handleEnterForum(forum)}
              />
            ))}
          </div>
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

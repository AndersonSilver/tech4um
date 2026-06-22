import { Forum } from "../types";
import { getForumActivityLabel } from "../utils/forumMetrics";

interface ForumCarouselProps {
  forums: Forum[];
  activeForumId: string;
  onSelect: (forum: Forum) => void;
}

export function ForumCarousel({ forums, activeForumId, onSelect }: ForumCarouselProps) {
  const sorted = [...forums].sort((a, b) => {
    if (a.id === activeForumId) return -1;
    if (b.id === activeForumId) return 1;
    return 0;
  });

  return (
    <div className="shrink-0 w-full min-w-0 max-w-full lg:w-[180px] flex flex-col gap-2 min-h-0 lg:h-full">
      <div className="flex items-center justify-between lg:px-1">
        <span className="font-poppins text-[10px] font-semibold uppercase tracking-wide text-bordergray">
          Outras salas
        </span>
        <span className="font-poppins text-[10px] text-bordergray lg:hidden">
          {forums.length} no total
        </span>
      </div>

      <div className="flex lg:flex-col gap-2 w-full min-w-0 max-w-full h-[104px] lg:h-auto lg:flex-1 lg:min-h-0 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto pb-1 lg:pb-0 snap-x lg:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:[scrollbar-width:auto] lg:[&::-webkit-scrollbar]:auto">
        {sorted.map((forum) => {
          const isActive = forum.id === activeForumId;

          return (
            <button
              key={forum.id}
              type="button"
              onClick={() => onSelect(forum)}
              className={`flex flex-col items-start justify-center p-3 lg:p-4 rounded-compact shadow-compact text-left transition-colors min-w-[160px] max-w-[200px] lg:min-w-0 lg:max-w-none lg:w-full shrink-0 lg:shrink snap-start ${
                isActive
                  ? "bg-primary-dark ring-2 ring-primary-dark/30"
                  : "bg-white border border-bordergray hover:border-primary-dark/40"
              }`}
            >
              <span
                className={`font-poppins font-bold text-xs leading-snug w-full line-clamp-2 ${
                  isActive ? "text-background" : "text-primary-default"
                }`}
              >
                {forum.name}
              </span>
              <span
                className={`font-poppins font-light text-[10px] w-full truncate mt-1 ${
                  isActive ? "text-background/80" : "text-textgray"
                }`}
              >
                {getForumActivityLabel(forum)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

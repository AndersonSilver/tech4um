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
    <div className="flex lg:flex-col gap-2 w-full lg:w-[180px] h-auto max-h-[140px] lg:max-h-none lg:h-full overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto shrink-0 self-stretch min-h-0 pb-1 lg:pb-0">
      {sorted.map((forum) => {
        const isActive = forum.id === activeForumId;

        return (
          <button
            key={forum.id}
            type="button"
            onClick={() => onSelect(forum)}
            className={`flex flex-col items-start justify-center p-4 rounded-compact shadow-compact text-left transition-colors min-w-[148px] lg:min-w-0 lg:w-full shrink-0 lg:shrink ${
              isActive
                ? "bg-primary-dark"
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
  );
}

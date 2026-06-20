import { Forum } from "../types";

interface ForumCarouselProps {
  forums: Forum[];
  activeForumId: string;
  onSelect: (forum: Forum) => void;
}

export function ForumCarousel({ forums, activeForumId, onSelect }: ForumCarouselProps) {
  return (
    <div className="flex flex-col gap-2 px-2 pb-2 w-[163px] overflow-y-auto max-h-[820px]">
      {forums.map((forum) => {
        const isActive = forum.id === activeForumId;
        return (
          <button
            key={forum.id}
            onClick={() => onSelect(forum)}
            className={`flex flex-col items-start justify-center p-4 rounded-compact shadow-compact text-left ${
              isActive ? "bg-primary-dark" : "bg-background"
            }`}
          >
            <span
              className={`font-poppins font-bold text-xs truncate w-full ${
                isActive ? "text-background" : "text-primary-default"
              }`}
            >
              {forum.name}
            </span>
            <span
              className={`font-poppins font-light text-[10px] ${
                isActive ? "text-bordergray" : "text-textgray"
              }`}
            >
              +{forum.participants?.length ?? 0} pessoas
            </span>
          </button>
        );
      })}
    </div>
  );
}

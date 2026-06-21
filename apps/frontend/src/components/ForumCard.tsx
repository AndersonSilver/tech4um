import { Forum } from "../types";
import {
  countOnlineParticipants,
  getForumActivityLabel,
} from "../utils/forumMetrics";

type CardSize = "extra-large" | "large" | "medium" | "small";

interface ForumCardProps {
  forum: Forum;
  size: CardSize;
  featured?: boolean;
  onClick?: () => void;
}

const sizeClasses: Record<CardSize, string> = {
  "extra-large": "p-6 sm:p-8 min-h-[240px] sm:min-h-[280px]",
  large: "p-6 sm:p-8 min-h-[200px] sm:min-h-[220px]",
  medium: "px-6 py-5 sm:px-8 sm:py-6 min-h-[170px]",
  small: "px-6 py-5 sm:px-8 sm:py-6 min-h-[170px]",
};

const titleClasses: Record<CardSize, string> = {
  "extra-large": "text-xl sm:text-[28px] leading-tight font-bold text-primary-dark",
  large: "text-xl sm:text-[28px] leading-tight font-bold text-primary-dark",
  medium: "text-lg leading-tight font-bold text-primary-dark",
  small: "text-base leading-tight font-bold text-primary-default",
};

const descriptionClampClasses: Record<CardSize, string> = {
  "extra-large": "line-clamp-4",
  large: "line-clamp-3",
  medium: "line-clamp-2",
  small: "line-clamp-2",
};

export function ForumCard({ forum, size, featured, onClick }: ForumCardProps) {
  const onlineCount = countOnlineParticipants(forum);
  const ownerName = forum.owner?.username ?? "Nome do criador";
  const hasDescription = Boolean(forum.description?.trim());

  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white w-full h-full flex flex-col justify-between items-start text-left rounded-card shadow-card transition-transform hover:-translate-y-0.5 hover:shadow-card-lg duration-150 ${sizeClasses[size]}`}
    >
      <div className="flex flex-col gap-3 sm:gap-4 w-full flex-1 min-w-0">
        <div className="flex flex-col items-start w-full gap-1 min-w-0">
          {featured && (
            <span className="font-poppins font-bold italic text-secondary-default text-sm sm:text-base leading-none">
              Tópico em destaque!
            </span>
          )}
          <h3 className={`font-poppins ${titleClasses[size]} truncate w-full m-0`}>
            {forum.name}
          </h3>
          <span className="font-poppins font-light text-xs text-textgray leading-normal">
            {getForumActivityLabel(forum)}
          </span>
        </div>

        {hasDescription && (
          <p
            className={`font-poppins font-light text-xs text-textgray m-0 leading-relaxed ${descriptionClampClasses[size]}`}
          >
            {forum.description}
          </p>
        )}
      </div>

      <div className="flex items-end justify-between w-full mt-4 gap-3 min-w-0">
        <div className="flex gap-1 items-start text-textgray text-sm leading-normal min-w-0">
          <span className="font-poppins font-light shrink-0">Criado por:</span>
          <span className="font-poppins font-semibold truncate">{ownerName}</span>
        </div>
        <div
          className="bg-primary-dark flex items-center justify-center gap-1.5 min-w-[40px] h-10 px-[10px] rounded-full shrink-0"
          title={`${onlineCount} participante${onlineCount === 1 ? "" : "s"} online`}
          aria-label={`${onlineCount} participante${onlineCount === 1 ? "" : "s"} online`}
        >
          <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" aria-hidden />
          <span className="font-poppins font-semibold text-[10px] text-background leading-none">
            {onlineCount}
          </span>
        </div>
      </div>
    </button>
  );
}

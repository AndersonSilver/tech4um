import { Forum } from "../types";

type CardSize = "extra-large" | "large" | "medium" | "small";

interface ForumCardProps {
  forum: Forum;
  size: CardSize;
  featured?: boolean;
  onClick?: () => void;
}

const sizeClasses: Record<CardSize, string> = {
  "extra-large": "p-8 rounded-card shadow-card",
  large: "p-8 rounded-card shadow-card-lg",
  medium: "px-8 py-[23px] rounded-card shadow-card h-[170px]",
  small: "px-8 py-[23px] rounded-card shadow-card h-[170px] w-[249px]",
};

const titleClasses: Record<CardSize, string> = {
  "extra-large": "text-[28px] font-bold text-primary-dark",
  large: "text-[28px] font-bold text-primary-dark",
  medium: "text-lg font-bold text-primary-dark",
  small: "text-base font-bold text-primary-default",
};

export function ForumCard({ forum, size, featured, onClick }: ForumCardProps) {
  const participantsCount = forum.participants?.length ?? 0;
  const onlineCount = forum.participants?.filter((p) => p.isOnline).length ?? 0;
  const peopleLabel = participantsCount === 1 ? "pessoa" : "pessoas";
  const ownerName = forum.owner?.username ?? "Anônimo";

  return (
    <button
      onClick={onClick}
      className={`bg-background flex flex-col justify-center items-start text-left transition-transform hover:-translate-y-0.5 hover:shadow-card-lg duration-150 ${sizeClasses[size]}`}
    >
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col items-start w-full">
          {featured && (
            <span className="font-poppins font-bold italic text-secondary-default text-base mb-0">
              Tópico em destaque!
            </span>
          )}
          <h3 className={`font-poppins ${titleClasses[size]} truncate w-full m-0`}>
            {forum.name}
          </h3>
          <span className="font-poppins font-light text-xs text-textgray">
            {ownerName} +{participantsCount} {peopleLabel}
            {onlineCount > 0 && (
              <span className="text-green-600"> · {onlineCount} online</span>
            )}
          </span>
        </div>

        {(size === "extra-large" || size === "large") && forum.description && (
          <p className="font-poppins text-xs text-textgray line-clamp-3 m-0">
            {forum.description}
          </p>
        )}

        <div className="flex items-end justify-between w-full">
          <div className="flex gap-1 items-start text-textgray text-sm">
            <span className="font-poppins font-light">Criado por:</span>
            <span className="font-poppins font-semibold">{ownerName}</span>
          </div>
          <div className="bg-primary-dark flex items-start p-[10px] rounded-full">
            <span className="font-poppins font-semibold text-[10px] text-background">
              +{participantsCount}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

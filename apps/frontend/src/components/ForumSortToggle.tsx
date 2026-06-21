import type { ForumSortMode } from "../utils/forumMetrics";

interface ForumSortToggleProps {
  value: ForumSortMode;
  onChange: (mode: ForumSortMode) => void;
}

const OPTIONS: { value: ForumSortMode; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "popular", label: "Mais populares" },
];

export function ForumSortToggle({ value, onChange }: ForumSortToggleProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Ordenar fóruns"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={`h-9 px-4 rounded-button font-poppins text-xs font-semibold border transition-colors ${
              isActive
                ? "bg-primary-dark text-background border-primary-dark"
                : "bg-white text-textgray border-bordergray hover:border-primary-dark/40"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

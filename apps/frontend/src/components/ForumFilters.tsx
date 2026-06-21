import { useEffect, useRef, useState } from "react";
import type { ForumActivityFilter, ForumSortMode } from "../utils/forumMetrics";

interface ForumFiltersProps {
  sortMode: ForumSortMode;
  activityFilter: ForumActivityFilter;
  onSortChange: (mode: ForumSortMode) => void;
  onActivityFilterChange: (filter: ForumActivityFilter) => void;
}

const SORT_OPTIONS: { value: ForumSortMode; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigos" },
  { value: "popular", label: "Mais populares" },
  { value: "members", label: "Mais inscritos" },
  { value: "name", label: "A–Z" },
];

const ACTIVITY_OPTIONS: { value: ForumActivityFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "online", label: "Com atividade" },
  { value: "empty", label: "Sem atividade" },
];

function FilterIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className={active ? "text-primary-dark" : "text-textgray"}
    >
      <path
        d="M2.5 4.5H15.5M5 9H13M7.5 13.5H10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuOption<T extends string>({
  label,
  isActive,
  onSelect,
}: {
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={isActive}
      onClick={onSelect}
      className={`w-full px-4 py-2.5 text-left font-poppins text-sm transition-colors flex items-center justify-between gap-3 ${
        isActive
          ? "text-primary-dark bg-primary-dark/5 font-semibold"
          : "text-textgray hover:bg-surface"
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary-dark shrink-0" aria-hidden />
      )}
    </button>
  );
}

function MenuSection<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <p className="px-4 pt-3 pb-1 font-poppins text-[10px] font-semibold uppercase tracking-wide text-bordergray m-0">
        {title}
      </p>
      {options.map((option) => (
        <MenuOption
          key={option.value}
          label={option.label}
          isActive={value === option.value}
          onSelect={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

function formatResultCount(count: number): string {
  if (count === 0) return "Nenhuma sala encontrada";
  if (count === 1) return "1 sala encontrada";
  return `${count} salas encontradas`;
}

export function ForumFilters({
  sortMode,
  activityFilter,
  onSortChange,
  onActivityFilterChange,
}: ForumFiltersProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = sortMode !== "recent" || activityFilter !== "all";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleReset() {
    onSortChange("recent");
    onActivityFilterChange("all");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Filtros e ordenação"
        aria-expanded={open}
        aria-haspopup="menu"
        className={`relative h-11 w-11 rounded-button border flex items-center justify-center transition-colors ${
          open || hasActiveFilters
            ? "border-primary-dark bg-white shadow-compact"
            : "border-bordergray bg-white hover:border-primary-dark/40"
        }`}
      >
        <FilterIcon active={open || hasActiveFilters} />
        {hasActiveFilters && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary-default"
            aria-hidden
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Filtros e ordenação de salas"
          className="absolute right-0 top-full mt-2 w-[min(100vw-2rem,280px)] rounded-compact bg-white shadow-panel border border-bordergray z-30 overflow-hidden"
        >
          <MenuSection
            title="Ordenar"
            options={SORT_OPTIONS}
            value={sortMode}
            onChange={(mode) => {
              onSortChange(mode);
            }}
          />

          <div className="my-1 border-t border-bordergray/60" />

          <MenuSection
            title="Filtrar"
            options={ACTIVITY_OPTIONS}
            value={activityFilter}
            onChange={(filter) => {
              onActivityFilterChange(filter);
            }}
          />

          {hasActiveFilters && (
            <>
              <div className="my-1 border-t border-bordergray/60" />
              <button
                type="button"
                onClick={handleReset}
                className="w-full px-4 py-3 text-left font-poppins text-xs text-secondary-default hover:bg-surface transition-colors"
              >
                Limpar filtros
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ForumFiltersSummary({ resultCount }: { resultCount: number }) {
  return (
    <p className="font-poppins text-xs text-bordergray m-0">
      {formatResultCount(resultCount)}
    </p>
  );
}

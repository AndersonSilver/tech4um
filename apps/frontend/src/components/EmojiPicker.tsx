import { useEffect, useMemo, useRef, useState } from "react";
import {
  EMOJI_CATEGORIES,
  loadRecentEmojis,
  saveRecentEmoji,
} from "../data/chatEmojis";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => loadRecentEmojis());

  const categories = useMemo(() => {
    if (recentEmojis.length === 0) {
      return EMOJI_CATEGORIES;
    }

    return [
      {
        id: "recent",
        icon: "🕒",
        label: "Recentes",
        emojis: recentEmojis,
      },
      ...EMOJI_CATEGORIES,
    ];
  }, [recentEmojis]);

  const activeEmojis =
    categories.find((category) => category.id === activeCategory)?.emojis ??
    categories[0]?.emojis ??
    [];

  useEffect(() => {
    if (recentEmojis.length === 0 && activeCategory === "recent") {
      setActiveCategory(EMOJI_CATEGORIES[0].id);
    }
  }, [recentEmojis.length, activeCategory]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function handleEmojiClick(emoji: string) {
    saveRecentEmoji(emoji);
    setRecentEmojis(loadRecentEmojis());
    onSelect(emoji);
  }

  return (
    <div
      ref={containerRef}
      className="absolute right-0 bottom-full mb-2 z-30 w-[320px] rounded-compact bg-white shadow-panel border border-bordergray overflow-hidden"
      role="dialog"
      aria-label="Seletor de emojis"
    >
      <div className="px-3 py-2 border-b border-bordergray/60">
        <p className="font-poppins text-[11px] text-textgray m-0">Emojis</p>
      </div>

      <div className="h-[220px] overflow-y-auto p-2">
        {activeEmojis.length === 0 ? (
          <p className="font-poppins text-xs text-bordergray text-center py-10 m-0">
            Nenhum emoji recente ainda
          </p>
        ) : (
          <div className="grid grid-cols-8 gap-0.5">
            {activeEmojis.map((emoji) => (
              <button
                key={`${activeCategory}-${emoji}`}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-[22px] leading-none border-0 bg-transparent p-1.5 cursor-pointer hover:bg-surface rounded flex items-center justify-center"
                aria-label={`Inserir emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 px-2 py-1.5 border-t border-bordergray/60 bg-surface/40 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            className={`shrink-0 text-lg border-0 bg-transparent p-1.5 cursor-pointer rounded transition-colors ${
              activeCategory === category.id ? "bg-white shadow-sm" : "hover:bg-white/70"
            }`}
            aria-label={category.label}
            title={category.label}
          >
            {category.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  EMOJI_CATEGORIES,
  loadRecentEmojis,
  saveRecentEmoji,
} from "../data/chatEmojis";

const PICKER_WIDTH = 320;
const PICKER_MARGIN = 8;

interface EmojiPickerProps {
  anchorRef: RefObject<HTMLElement | null>;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ anchorRef, onSelect, onClose }: EmojiPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState("recent");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => loadRecentEmojis());
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

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

  useLayoutEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const left = Math.min(
        Math.max(PICKER_MARGIN, rect.right - PICKER_WIDTH),
        window.innerWidth - PICKER_WIDTH - PICKER_MARGIN
      );

      setPosition({ top: rect.top - PICKER_MARGIN, left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    if (recentEmojis.length === 0 && activeCategory === "recent") {
      setActiveCategory(EMOJI_CATEGORIES[0].id);
    }
  }, [recentEmojis.length, activeCategory]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
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
  }, [anchorRef, onClose]);

  function handleEmojiClick(emoji: string) {
    saveRecentEmoji(emoji);
    setRecentEmojis(loadRecentEmojis());
    onSelect(emoji);
  }

  if (!position) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-[120] w-[320px] -translate-y-full rounded-compact bg-white shadow-panel border border-bordergray overflow-hidden"
      style={{ top: position.top, left: position.left }}
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
    </div>,
    document.body
  );
}

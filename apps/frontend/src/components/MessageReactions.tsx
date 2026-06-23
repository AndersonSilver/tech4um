import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChatMessageReaction, QUICK_REACTION_EMOJIS } from "@tech4um/shared";

const MENU_MARGIN = 8;
const MENU_ESTIMATED_WIDTH = 260;
const MENU_ESTIMATED_HEIGHT = 40;

function SmileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.2" fill="currentColor" />
      <circle cx="15" cy="10" r="1.2" fill="currentColor" />
      <path
        d="M8.5 14.5C10 16.5 14 16.5 15.5 14.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface MessageReactionBarProps {
  isOwn: boolean;
  highlighted?: boolean;
  onReact: (emoji: string) => void;
}

export function MessageReactionBar({ isOwn, highlighted = false, onReact }: MessageReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!showPicker) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      const anchor = buttonRef.current;
      const menu = menuRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth ?? MENU_ESTIMATED_WIDTH;
      const menuHeight = menu?.offsetHeight ?? MENU_ESTIMATED_HEIGHT;

      let top = rect.bottom + 6;
      if (top + menuHeight > window.innerHeight - MENU_MARGIN) {
        top = rect.top - menuHeight - 6;
      }

      let left = isOwn ? rect.right - menuWidth : rect.left;
      left = Math.min(
        Math.max(MENU_MARGIN, left),
        window.innerWidth - menuWidth - MENU_MARGIN
      );

      setPosition({ top, left });
    }

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showPicker, isOwn]);

  useEffect(() => {
    if (!showPicker) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setShowPicker(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowPicker(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPicker]);

  function handleReact(emoji: string) {
    onReact(emoji);
    setShowPicker(false);
  }

  const isVisible = showPicker || highlighted;

  return (
    <div
      className={`absolute top-1/2 -translate-y-1/2 z-10 shrink-0 transition-opacity ${
        isOwn ? "left-0" : "right-0"
      } ${
        isVisible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
      }`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setShowPicker((open) => !open);
        }}
        className={`h-7 w-7 rounded-full border border-bordergray bg-white text-textgray shadow-sm flex items-center justify-center cursor-pointer hover:bg-surface hover:text-primary-dark transition-colors ${
          showPicker ? "bg-surface text-primary-dark" : ""
        }`}
        aria-label="Reagir à mensagem"
        aria-expanded={showPicker}
      >
        <SmileIcon />
      </button>

      {showPicker &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[120] flex items-center gap-0.5 rounded-full border border-bordergray bg-white px-1.5 py-1 shadow-panel whitespace-nowrap"
            style={{ top: position.top, left: position.left }}
            role="menu"
            aria-label="Escolher reação"
          >
            {QUICK_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="text-base leading-none border-0 bg-transparent p-1 cursor-pointer rounded-full hover:bg-surface transition-colors"
                aria-label={`Reagir com ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

interface MessageReactionListProps {
  reactions: ChatMessageReaction[];
  currentUserId?: string;
  isOwn: boolean;
  onReact: (emoji: string) => void;
}

interface GroupedReaction {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

function groupReactions(
  reactions: ChatMessageReaction[],
  currentUserId?: string
): GroupedReaction[] {
  const grouped = new Map<string, GroupedReaction>();

  for (const reaction of reactions) {
    const existing = grouped.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      if (reaction.userId === currentUserId) {
        existing.reactedByMe = true;
      }
    } else {
      grouped.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        reactedByMe: reaction.userId === currentUserId,
      });
    }
  }

  return Array.from(grouped.values());
}

export function MessageReactionList({
  reactions,
  currentUserId,
  isOwn,
  onReact,
}: MessageReactionListProps) {
  const grouped = useMemo(
    () => groupReactions(reactions, currentUserId),
    [reactions, currentUserId]
  );

  if (grouped.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
      {grouped.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => onReact(reaction.emoji)}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-poppins cursor-pointer transition-colors ${
            reaction.reactedByMe
              ? "border-primary-dark/30 bg-primary-dark/10 text-primary-dark"
              : "border-bordergray bg-surface text-textgray hover:bg-white"
          }`}
          aria-label={`${reaction.count} reação(ões) com ${reaction.emoji}`}
        >
          <span className="text-sm leading-none">{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}

import { useState } from "react";
import { Message } from "../types";
import { resolveMessageImageUrl } from "./ChatMessageComposer";
import { resolveAvatarUrl, getUserInitial } from "../utils/resolveAvatarUrl";
import { ImageLightbox } from "./ImageLightbox";
import { MessageReactionBar, MessageReactionList } from "./MessageReactions";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
  senderAvatarUrl?: string | null;
  currentUserId?: string;
  onReact: (messageId: string, emoji: string) => void;
}

function isEmojiOnlyMessage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return !/[a-zA-Z0-9À-ÿ]/.test(trimmed);
}

function shouldJustifyMessage(text: string): boolean {
  return text.trim().length >= 60;
}

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderAvatarUrl,
  currentUserId,
  onReact,
}: MessageBubbleProps) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const displayName = isOwn
    ? "Você"
    : (senderName ?? message.sender?.username ?? "Usuário");
  const avatarUrl = resolveAvatarUrl(
    senderAvatarUrl ?? message.sender?.avatarUrl
  );
  const imageSrc = resolveMessageImageUrl(message.imageUrl);
  const emojiOnly = message.content ? isEmojiOnlyMessage(message.content) : false;
  const justifyText = Boolean(message.content && !emojiOnly && shouldJustifyMessage(message.content));

  return (
    <div className={`flex w-full min-w-0 overflow-hidden ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex gap-3 items-start max-w-[80%] min-w-0 ${
          isOwn ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <div className="w-9 h-9 rounded-full bg-bordergray overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-poppins text-xs text-background bg-primary-dark">
              {getUserInitial(displayName)}
            </span>
          )}
        </div>

        <div
          className={`relative group flex flex-col gap-1 min-w-0 max-w-full ${
            isOwn ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`relative flex items-center gap-2 ${
              isOwn ? "flex-row-reverse pl-8" : "pr-8"
            }`}
          >
            <span className="font-poppins font-semibold text-sm text-textgray">{displayName}</span>
            <span className="font-poppins text-[10px] text-bordergray">{time}</span>
            <MessageReactionBar
              isOwn={isOwn}
              onReact={(emoji) => onReact(message.id, emoji)}
            />
          </div>

          {message.type === "private" && (
            <span className="font-poppins font-bold text-[10px] text-primary-dark break-words break-anywhere max-w-full">
              {isOwn
                ? `mensagem privada para ${message.recipient?.username ?? "usuário"}`
                : "mensagem privada"}
            </span>
          )}

          {imageSrc && (
            <>
              <button
                type="button"
                onClick={() => setIsImageExpanded(true)}
                className="mt-1 border-0 bg-transparent p-0 cursor-zoom-in rounded-compact overflow-hidden hover:opacity-90 transition-opacity"
                aria-label="Ampliar imagem"
              >
                <img
                  src={imageSrc}
                  alt="Imagem enviada no chat"
                  className="max-w-[260px] max-h-[260px] rounded-compact object-cover pointer-events-none"
                />
              </button>

              {isImageExpanded && (
                <ImageLightbox
                  src={imageSrc}
                  alt={`Imagem enviada por ${displayName}`}
                  onClose={() => setIsImageExpanded(false)}
                />
              )}
            </>
          )}

          {message.content && (
            <p
              className={`font-poppins m-0 leading-relaxed whitespace-pre-wrap break-words break-anywhere max-w-full ${
                emojiOnly ? "text-[28px] leading-tight" : "font-medium text-sm"
              } ${justifyText ? "text-justify" : isOwn ? "text-right" : "text-left"} ${
                isOwn ? "text-primary-dark" : "text-textgray"
              }`}
            >
              {message.content}
            </p>
          )}

          <MessageReactionList
            reactions={message.reactions ?? []}
            currentUserId={currentUserId}
            isOwn={isOwn}
            onReact={(emoji) => onReact(message.id, emoji)}
          />
        </div>
      </div>
    </div>
  );
}

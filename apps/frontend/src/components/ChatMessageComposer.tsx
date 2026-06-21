import { useRef, useState } from "react";
import { api } from "../services/api";
import { EmojiPicker } from "./EmojiPicker";

function PaperPlaneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 11L21 3L13 21L11 13L3 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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

function ImageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path
        d="M6 17L10 13L13 16L17 12L20 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface ChatMessageComposerProps {
  content: string;
  isPrivateMode: boolean;
  recipientName?: string;
  pendingImageUrl: string | null;
  isUploading: boolean;
  onContentChange: (value: string) => void;
  onTyping: () => void;
  onSend: () => void;
  onCancelPrivate: () => void;
  onImageSelected: (file: File) => void;
  onImageRejected?: (message: string) => void;
  onRemovePendingImage: () => void;
}

export function ChatMessageComposer({
  content,
  isPrivateMode,
  recipientName,
  pendingImageUrl,
  isUploading,
  onContentChange,
  onTyping,
  onSend,
  onCancelPrivate,
  onImageSelected,
  onImageRejected,
  onRemovePendingImage,
}: ChatMessageComposerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function insertEmoji(emoji: string) {
    const input = inputRef.current;
    if (!input) {
      onContentChange(`${content}${emoji}`);
      onTyping();
      return;
    }

    const start = input.selectionStart ?? content.length;
    const end = input.selectionEnd ?? content.length;
    const nextValue = `${content.slice(0, start)}${emoji}${content.slice(end)}`;
    onContentChange(nextValue);
    onTyping();

    requestAnimationFrame(() => {
      input.focus();
      const cursor = start + emoji.length;
      input.setSelectionRange(cursor, cursor);
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_IMAGE_BYTES) {
        onImageRejected?.("A imagem deve ter no máximo 10MB.");
        event.target.value = "";
        return;
      }
      onImageSelected(file);
    }
    event.target.value = "";
  }

  return (
    <div
      className={`rounded-b-card flex flex-col gap-2 px-8 pt-3 pb-5 shrink-0 transition-colors ${
        isPrivateMode ? "bg-secondary-dark" : "bg-primary-dark"
      }`}
    >
      <div className="flex items-center justify-between w-full gap-4">
        <p className="font-poppins font-bold text-[10px] text-background m-0 shrink-0">
          {isPrivateMode && recipientName
            ? `Enviando para ${recipientName}`
            : "Enviando para todos do 4um"}
        </p>

        <div className="flex items-center gap-4 shrink-0 ml-auto relative">
          {isPrivateMode && (
            <button
              type="button"
              onClick={onCancelPrivate}
              className="font-poppins text-[10px] text-background underline border-0 bg-transparent cursor-pointer whitespace-nowrap"
            >
              Cancelar envio de mensagem privada
            </button>
          )}

          <button
            type="button"
            aria-label="Abrir emojis"
            onClick={() => setShowEmojiPicker((open) => !open)}
            className="text-background border-0 bg-transparent p-0 cursor-pointer opacity-95 hover:opacity-100 transition-opacity"
          >
            <SmileIcon />
          </button>

          {showEmojiPicker && (
            <EmojiPicker
              onSelect={insertEmoji}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}

          <button
            type="button"
            aria-label="Anexar imagem"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="text-background border-0 bg-transparent p-0 cursor-pointer opacity-95 hover:opacity-100 transition-opacity disabled:opacity-50"
          >
            <ImageIcon />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {pendingImageUrl && (
        <div className="relative w-fit">
          <img
            src={pendingImageUrl}
            alt="Pré-visualização"
            className="h-20 w-auto rounded-compact border border-white/40"
          />
          <button
            type="button"
            onClick={onRemovePendingImage}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-black text-white text-xs border-0 cursor-pointer"
            aria-label="Remover imagem"
          >
            ×
          </button>
        </div>
      )}

      <div className="relative w-full">
        <input
          ref={inputRef}
          value={content}
          onChange={(e) => {
            onContentChange(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
          placeholder="Escreva aqui uma mensagem maneira para mandar para os colegas..."
          className="w-full h-12 rounded-full bg-white pl-6 pr-14 outline-none font-poppins font-light text-xs text-textgray placeholder:text-bordergray"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={isUploading}
          aria-label="Enviar mensagem"
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-background border-0 cursor-pointer hover:brightness-110 transition-all disabled:opacity-50 ${
            isPrivateMode ? "bg-black" : "bg-primary-dark"
          }`}
        >
          <PaperPlaneIcon />
        </button>
      </div>
    </div>
  );
}

export function resolveMessageImageUrl(imageUrl?: string) {
  if (!imageUrl) return null;
  const apiBase = import.meta.env.VITE_API_URL || "/api";
  const origin = apiBase.startsWith("http")
    ? apiBase.replace(/\/api\/?$/, "")
    : window.location.origin;
  return `${origin}${imageUrl}`;
}

export async function uploadForumImage(forumId: string, file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler a imagem"));
    reader.readAsDataURL(file);
  });

  const { data } = await api.post<{ imageUrl: string }>(`/forums/${forumId}/messages/upload`, {
    dataUrl,
  });

  return data.imageUrl;
}

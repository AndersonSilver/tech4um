import { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = new Date(message.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex gap-2 items-start w-full">
      <div className="w-8 h-8 rounded-full bg-bordergray overflow-hidden shrink-0">
        {message.sender?.avatarUrl && (
          <img
            src={message.sender.avatarUrl}
            alt={message.sender.username}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="font-poppins font-medium text-xs text-textgray">
            {message.sender?.username ?? "Usuário"}
          </span>
          {message.type === "private" && (
            <span className="font-poppins font-bold text-xs text-primary-dark">
              {isOwn ? `mensagem privada para ${message.recipient?.username}` : "mensagem privada"}
            </span>
          )}
          <span className="font-poppins text-[10px] text-bordergray">{time}</span>
        </div>
        <p
          className={`font-poppins font-medium text-sm m-0 ${
            message.type === "private" ? "text-primary-dark" : "text-textgray"
          }`}
        >
          {message.content}
        </p>
      </div>
    </div>
  );
}

import type { ChatMessage, ChatMessageReaction } from "@tech4um/shared";
import { Message } from "../entities/Message";
import { MessageReaction } from "../entities/MessageReaction";

function toChatMessageReaction(reaction: MessageReaction): ChatMessageReaction {
  return {
    emoji: reaction.emoji,
    userId: reaction.userId,
    user: reaction.user?.toPublic(),
  };
}

export function toChatMessage(message: Message): ChatMessage {
  return {
    id: message.id,
    content: message.content,
    type: message.type,
    senderId: message.senderId,
    recipientId: message.recipientId,
    forumId: message.forumId,
    createdAt:
      message.createdAt instanceof Date
        ? message.createdAt.toISOString()
        : String(message.createdAt),
    imageUrl: message.imageUrl,
    sender: message.sender?.toPublic(),
    recipient: message.recipient?.toPublic(),
    reactions: message.reactions?.map(toChatMessageReaction) ?? [],
  };
}

import { QUICK_REACTION_EMOJIS } from "@tech4um/shared";
import { MessageReactionRepository } from "../repositories/MessageReactionRepository";
import { MessageRepository } from "../repositories/MessageRepository";

const ALLOWED_REACTIONS = new Set<string>(QUICK_REACTION_EMOJIS);

export class MessageReactionService {
  constructor(
    private reactionRepository: MessageReactionRepository = new MessageReactionRepository(),
    private messageRepository: MessageRepository = new MessageRepository()
  ) {}

  isAllowedEmoji(emoji: string): boolean {
    return ALLOWED_REACTIONS.has(emoji);
  }

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    if (!this.isAllowedEmoji(emoji)) {
      throw new Error("Emoji de reação inválido");
    }

    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new Error("Mensagem não encontrada");
    }

    if (!message.isVisibleTo(userId)) {
      throw new Error("Mensagem não visível para este usuário");
    }

    const existing = await this.reactionRepository.findByMessageAndUser(messageId, userId);

    if (existing?.emoji === emoji) {
      await this.reactionRepository.remove(existing);
    } else if (existing) {
      existing.emoji = emoji;
      await this.reactionRepository.save(existing);
    } else {
      await this.reactionRepository.create({ messageId, userId, emoji });
    }

    return this.reactionRepository.findByMessage(messageId);
  }
}

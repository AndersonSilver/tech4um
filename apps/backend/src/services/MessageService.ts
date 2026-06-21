import { MessageRepository } from "../repositories/MessageRepository";
import { MessageType } from "../entities/Message";

interface SendMessageInput {
  forumId: string;
  senderId: string;
  content: string;
  recipientId?: string;
  imageUrl?: string;
}

export class MessageService {
  constructor(private messageRepository: MessageRepository = new MessageRepository()) {}

  async sendPublic(input: Omit<SendMessageInput, "recipientId">) {
    return this.messageRepository.create({
      ...input,
      type: MessageType.PUBLIC,
    });
  }

  async sendPrivate(input: SendMessageInput) {
    return this.messageRepository.create({
      ...input,
      type: MessageType.PRIVATE,
    });
  }

  async listVisibleForUser(forumId: string, userId: string) {
    const messages = await this.messageRepository.findByForum(forumId);
    return messages.filter((message) => message.isVisibleTo(userId));
  }

  async getById(messageId: string) {
    return this.messageRepository.findById(messageId);
  }
}

import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { MessageReaction } from "../entities/MessageReaction";

export class MessageReactionRepository {
  private repo: Repository<MessageReaction> = AppDataSource.getRepository(MessageReaction);

  findByMessageAndUser(messageId: string, userId: string) {
    return this.repo.findOne({ where: { messageId, userId } });
  }

  findByMessage(messageId: string) {
    return this.repo.find({
      where: { messageId },
      relations: ["user"],
      order: { createdAt: "ASC" },
    });
  }

  create(data: Partial<MessageReaction>) {
    const reaction = this.repo.create(data);
    return this.repo.save(reaction);
  }

  save(reaction: MessageReaction) {
    return this.repo.save(reaction);
  }

  remove(reaction: MessageReaction) {
    return this.repo.remove(reaction);
  }
}

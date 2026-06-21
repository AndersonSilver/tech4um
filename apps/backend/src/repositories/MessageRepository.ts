import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Message } from "../entities/Message";

export class MessageRepository {
  private repo: Repository<Message> = AppDataSource.getRepository(Message);

  async create(data: Partial<Message>) {
    const message = this.repo.create(data);
    const saved = await this.repo.save(message);
    const loaded = await this.findById(saved.id);
    if (!loaded) {
      throw new Error("Message not found after create");
    }
    return loaded;
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ["sender", "recipient", "reactions", "reactions.user"],
    });
  }

  findByForum(forumId: string) {
    return this.repo.find({
      where: { forumId },
      relations: ["sender", "recipient", "reactions", "reactions.user"],
      order: { createdAt: "ASC" },
    });
  }
}

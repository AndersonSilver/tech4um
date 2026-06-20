import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Message } from "../entities/Message";

export class MessageRepository {
  private repo: Repository<Message> = AppDataSource.getRepository(Message);

  create(data: Partial<Message>) {
    const message = this.repo.create(data);
    return this.repo.save(message);
  }

  findByForum(forumId: string) {
    return this.repo.find({
      where: { forumId },
      relations: ["sender", "recipient"],
      order: { createdAt: "ASC" },
    });
  }
}

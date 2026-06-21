import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { Forum } from "../entities/Forum";
import { ForumParticipant } from "../entities/ForumParticipant";

export class ForumRepository {
  private repo: Repository<Forum> = AppDataSource.getRepository(Forum);
  private participantRepo: Repository<ForumParticipant> =
    AppDataSource.getRepository(ForumParticipant);

  findAll() {
    return this.repo.find({
      order: { createdAt: "DESC" },
      relations: ["owner", "participants", "participants.user"],
    });
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ["owner", "participants", "participants.user"],
    });
  }

  findByName(name: string) {
    return this.repo.findOne({ where: { name } });
  }

  create(data: Partial<Forum>) {
    const forum = this.repo.create(data);
    return this.repo.save(forum);
  }

  async addParticipant(forumId: string, userId: string) {
    const existing = await this.participantRepo.findOne({ where: { forumId, userId } });
    if (existing) return existing;

    const participant = this.participantRepo.create({ forumId, userId, isOnline: true });
    return this.participantRepo.save(participant);
  }

  setOnlineStatus(forumId: string, userId: string, isOnline: boolean) {
    return this.participantRepo.update({ forumId, userId }, { isOnline });
  }

  /** Marca offline em todas as salas exceto a ativa (usuário só "vê" uma sala por vez). */
  async setOfflineInOtherForums(userId: string, activeForumId: string): Promise<string[]> {
    const staleOnline = await this.participantRepo.find({
      where: { userId, isOnline: true },
    });

    const forumIds = staleOnline
      .filter((participant) => participant.forumId !== activeForumId)
      .map((participant) => participant.forumId);

    if (forumIds.length === 0) return [];

    await this.participantRepo
      .createQueryBuilder()
      .update()
      .set({ isOnline: false })
      .where("user_id = :userId", { userId })
      .andWhere("forum_id != :activeForumId", { activeForumId })
      .andWhere("is_online = true")
      .execute();

    return forumIds;
  }
}

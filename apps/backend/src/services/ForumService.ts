import { ForumRepository } from "../repositories/ForumRepository";
import { AppError } from "../utils/AppError";

interface CreateForumInput {
  name: string;
  description?: string;
  ownerId: string;
}

export class ForumService {
  constructor(private forumRepository: ForumRepository = new ForumRepository()) {}

  async list() {
    return this.forumRepository.findAll();
  }

  async create(input: CreateForumInput) {
    const existing = await this.forumRepository.findByName(input.name);
    if (existing) throw new AppError("Já existe um fórum com esse nome", 409);

    const forum = await this.forumRepository.create(input);
    await this.forumRepository.addParticipant(forum.id, input.ownerId);
    const populated = await this.forumRepository.findById(forum.id);
    return populated ?? forum;
  }

  async getById(id: string) {
    const forum = await this.forumRepository.findById(id);
    if (!forum) throw new AppError("Fórum não encontrado", 404);
    return forum;
  }

  async join(forumId: string, userId: string) {
    const forum = await this.getById(forumId);
    await this.forumRepository.addParticipant(forum.id, userId);
    return forum;
  }
}

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ForumService } from "../services/ForumService";

const createForumSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().max(255).optional(),
});

export class ForumController {
  constructor(private forumService: ForumService = new ForumService()) {}

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const forums = await this.forumService.list();
      return res.status(200).json(forums);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createForumSchema.parse(req.body);
      const ownerId = (req as any).userId as string;
      const forum = await this.forumService.create({ ...data, ownerId });
      return res.status(201).json(forum);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const forum = await this.forumService.getById(req.params.id);
      return res.status(200).json(forum);
    } catch (error) {
      next(error);
    }
  };

  join = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string;
      const forum = await this.forumService.join(req.params.id, userId);
      return res.status(200).json(forum);
    } catch (error) {
      next(error);
    }
  };
}

import { Request, Response, NextFunction } from "express";
import { MessageService } from "../services/MessageService";

export class MessageController {
  constructor(private messageService: MessageService = new MessageService()) {}

  listByForum = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).userId as string;
      const messages = await this.messageService.listVisibleForUser(req.params.id, userId);
      return res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  };
}

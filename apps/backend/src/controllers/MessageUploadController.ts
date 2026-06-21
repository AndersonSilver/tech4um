import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../utils/AppError";
import { saveImageFromDataUrl } from "../utils/imageUpload";

const uploadSchema = z.object({
  dataUrl: z.string().min(1),
});

export class MessageUploadController {
  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dataUrl } = uploadSchema.parse(req.body);

      try {
        const imageUrl = saveImageFromDataUrl(dataUrl);
        return res.status(201).json({ imageUrl });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha no upload";
        throw new AppError(message, 400);
      }
    } catch (error) {
      next(error);
    }
  };
}

import { Router } from "express";
import { ForumController } from "../controllers/ForumController";
import { MessageController } from "../controllers/MessageController";
import { MessageUploadController } from "../controllers/MessageUploadController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();
const forumController = new ForumController();
const messageController = new MessageController();
const messageUploadController = new MessageUploadController();

router.get("/", forumController.list);
router.post("/", authMiddleware, forumController.create);
router.get("/:id", forumController.getById);
router.post("/:id/join", authMiddleware, forumController.join);
router.get("/:id/messages", authMiddleware, messageController.listByForum);
router.post("/:id/messages/upload", authMiddleware, messageUploadController.upload);

export default router;

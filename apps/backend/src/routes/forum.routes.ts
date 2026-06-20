import { Router } from "express";
import { ForumController } from "../controllers/ForumController";
import { MessageController } from "../controllers/MessageController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireVerifiedEmail } from "../middlewares/requireVerifiedEmail";

const router = Router();
const forumController = new ForumController();
const messageController = new MessageController();

router.get("/", forumController.list);
router.post("/", authMiddleware, requireVerifiedEmail, forumController.create);
router.get("/:id", forumController.getById);
router.post("/:id/join", authMiddleware, forumController.join);
router.get("/:id/messages", authMiddleware, messageController.listByForum);

export default router;

import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { authRateLimiter } from "../middlewares/rateLimiters";

const router = Router();
const controller = new AuthController();

router.post("/register", authRateLimiter, controller.register);
router.post("/login", authRateLimiter, controller.login);
router.post("/google", authRateLimiter, controller.google);
router.post("/logout", authMiddleware, controller.logout);
router.get("/me", controller.me);
router.patch("/profile/avatar", authMiddleware, controller.updateAvatar);

export default router;

import { Router } from "express";
import authRoutes from "./auth.routes";
import forumRoutes from "./forum.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/forums", forumRoutes);

export default router;

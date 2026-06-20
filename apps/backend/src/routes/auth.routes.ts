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
router.get("/me", authMiddleware, controller.me);

// Verificação de e-mail
router.get("/verify-email", controller.verifyEmail);
router.post("/resend-verification", authRateLimiter, controller.resendVerification);

// MFA
router.post("/mfa/setup", authMiddleware, controller.mfaSetup);
router.post("/mfa/enable", authMiddleware, controller.mfaEnable);
router.post("/mfa/disable", authMiddleware, controller.mfaDisable);
router.post("/mfa/verify", authRateLimiter, controller.mfaVerify);

export default router;

import { Router } from "express";
import { login,register,getCurrentUser } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router();

router.post("/login", validate(loginSchema), login);

router.post("/register", validate(registerSchema), register);

router.get("/me", authenticate ,getCurrentUser);

export default router;
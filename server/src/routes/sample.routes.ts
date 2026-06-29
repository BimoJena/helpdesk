import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/me", requireAuth, (req, res) => {
  res.json({ message: "Authenticated", user: req.user });
});

export default router;

import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/users — list all users
router.get("/", requireAuth, requireAdmin, async (_req, res, next) => {
  prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  }).then((users) => res.json(users)).catch(next);
});

// DELETE /api/users/:id — delete a user (admin cannot delete themselves)
router.delete("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const { id } = req.params;

  if (req.user?.id === id) {
    res.status(400).json({ message: "You cannot delete your own account" });
    return;
  }

  prisma.user.delete({ where: { id } }).then(() => res.json({ message: "User deleted" })).catch(next);
});

export default router;

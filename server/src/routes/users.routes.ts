import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";
import { auth } from "../lib/auth.js";

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

// POST /api/users — create a new user
router.post("/", requireAuth, requireAdmin, async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "name, email and password are required" });
    return;
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 3) {
    res.status(400).json({ message: "Name must be at least 3 characters" });
    return;
  }

  if (password.includes(" ") || password.trim().length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters with no spaces" });
    return;
  }

  try {
    const result = await auth.api.signUpEmail({ body: { name: trimmedName, email, password } });
    res.status(201).json({ id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role, createdAt: result.user.createdAt });
  } catch (err: any) {
    if (err?.body?.code === "USER_ALREADY_EXISTS" || err?.code === "P2002" || err?.message?.toLowerCase().includes("already")) {
      res.status(409).json({ message: "A user with this email already exists" });
      return;
    }
    next(err);
  }
});

// PATCH /api/users/:id — update a user
router.patch("/:id", requireAuth, requireAdmin, async (req, res, next) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  const trimmedName = name?.trim();
  if (trimmedName !== undefined && trimmedName.length < 3) {
    res.status(400).json({ message: "Name must be at least 3 characters" });
    return;
  }

  if (password !== undefined && password !== "") {
    if (password.includes(" ") || password.trim().length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters with no spaces" });
      return;
    }
  }

  try {
    const updates: Record<string, any> = {};
    if (trimmedName) updates.name = trimmedName;
    if (email) updates.email = email;

    if (password && password.trim().length >= 8) {
      const { hashPassword } = await import("@better-auth/utils/password");
      const hashed = await hashPassword(password);
      await prisma.account.updateMany({
        where: { userId: id, providerId: "credential" },
        data: { password: hashed },
      });
    }

    const user = await prisma.user.update({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      data: updates,
    });
    res.json(user);
  } catch (err: any) {
    if (err?.code === "P2002") {
      res.status(409).json({ message: "A user with this email already exists" });
      return;
    }
    next(err);
  }
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

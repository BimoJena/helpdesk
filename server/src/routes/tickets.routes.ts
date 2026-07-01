import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/tickets — list all tickets, newest first
router.get("/", requireAuth, async (_req, res, next) => {
  prisma.ticket
    .findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        senderEmail: true,
        senderName: true,
        status: true,
        category: true,
        createdAt: true,
      },
    })
    .then((tickets) => res.json(tickets))
    .catch(next);
});

export default router;

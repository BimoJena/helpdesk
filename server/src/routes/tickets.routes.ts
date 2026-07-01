import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = Router();

const SORTABLE_COLUMNS = ["subject", "senderEmail", "status", "category", "createdAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

// GET /api/tickets — list all tickets with optional sorting
router.get("/", requireAuth, async (req, res, next) => {
  const sortBy = SORTABLE_COLUMNS.includes(req.query.sortBy as SortableColumn)
    ? (req.query.sortBy as SortableColumn)
    : "createdAt";
  const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";

  prisma.ticket
    .findMany({
      orderBy: { [sortBy]: sortDir },
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

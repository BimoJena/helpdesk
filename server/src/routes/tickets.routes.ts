import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import prisma from "../lib/prisma.js";

const router = Router();

const SORTABLE_COLUMNS = ["subject", "senderEmail", "status", "category", "createdAt"] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];

const VALID_STATUSES = ["open", "resolved", "closed"] as const;
const VALID_CATEGORIES = ["general_question", "technical_question", "refund_request"] as const;

// GET /api/tickets — list all tickets with optional sorting, filtering and pagination
router.get("/", requireAuth, async (req, res, next) => {
  const sortBy = SORTABLE_COLUMNS.includes(req.query.sortBy as SortableColumn)
    ? (req.query.sortBy as SortableColumn)
    : "createdAt";
  const sortDir = req.query.sortDir === "asc" ? "asc" : "desc";
  const status = VALID_STATUSES.includes(req.query.status as any) ? (req.query.status as typeof VALID_STATUSES[number]) : undefined;
  const category = VALID_CATEGORIES.includes(req.query.category as any) ? (req.query.category as typeof VALID_CATEGORIES[number]) : undefined;
  const search = typeof req.query.search === "string" && req.query.search.trim() ? req.query.search.trim() : undefined;
  const page = Math.max(0, parseInt(req.query.page as string) || 0);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

  const where = {
    ...(status && { status }),
    ...(category && { category }),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" as const } },
        { senderEmail: { contains: search, mode: "insensitive" as const } },
        { senderName: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip: page * pageSize,
      take: pageSize,
      select: {
        id: true,
        subject: true,
        senderEmail: true,
        senderName: true,
        status: true,
        category: true,
        createdAt: true,
      },
    }),
    prisma.ticket.count({ where }),
  ])
    .then(([data, total]) => res.json({ data, total }))
    .catch(next);
});

// GET /api/tickets/:id — get a single ticket
router.get("/:id", requireAuth, async (req, res, next) => {
  prisma.ticket
    .findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        subject: true,
        body: true,
        senderEmail: true,
        senderName: true,
        status: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    .then((ticket) => {
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      res.json(ticket);
    })
    .catch(next);
});

export default router;

import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import prisma from "../lib/prisma.js";

const router = Router();
const upload = multer();

function verifyMailgunSignature(timestamp: string, token: string, signature: string): boolean {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) return false;

  const value = timestamp + token;
  const expected = crypto.createHmac("sha256", signingKey).update(value).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// POST /api/webhooks/mailgun/inbound — public, verified by Mailgun signature
router.post("/", upload.none(), async (req, res, next) => {
  const { timestamp, token, signature, sender, from, subject, "stripped-text": body } = req.body;

  if (!verifyMailgunSignature(timestamp, token, signature)) {
    res.status(401).json({ message: "Invalid signature" });
    return;
  }

  // Parse display name from "Name <email>" format
  const fromHeader: string = from || sender || "";
  const nameMatch = fromHeader.match(/^(.+?)\s*<[^>]+>/);
  const senderName = nameMatch ? nameMatch[1].trim() : null;
  const emailMatch = fromHeader.match(/<([^>]+)>/);
  const senderEmail = emailMatch ? emailMatch[1] : sender;

  if (!senderEmail || !subject) {
    res.status(400).json({ message: "Missing required email fields" });
    return;
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        subject: subject.trim(),
        body: (body || "").trim(),
        senderEmail,
        senderName,
      },
    });
    res.status(201).json({ id: ticket.id });
  } catch (err) {
    next(err);
  }
});

export default router;

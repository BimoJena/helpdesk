import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

async function getSessionOrFail(req: Request, res: Response) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  return session;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await getSessionOrFail(req, res);
  if (!session) return;

  req.user = session.user;
  req.session = session.session;
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = await getSessionOrFail(req, res);
  if (!session) return;

  if (session.user.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  req.user = session.user;
  req.session = session.session;
  next();
}

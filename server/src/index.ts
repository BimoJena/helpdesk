import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import prisma from "./lib/prisma.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import sampleRoutes from "./routes/sample.routes.js";
import usersRoutes from "./routes/users.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

// Security headers
app.use(helmet());

app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));

const isProduction = process.env.NODE_ENV === "production";

// block public self-registration
app.post("/api/auth/sign-up/email", (_req, res) => {
  res.status(403).json({ message: "Sign up is disabled" });
});

if (isProduction) {
  // Rate limiter for all auth routes — 20 requests per 15 minutes per IP
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
  });

  // Stricter limiter for sign-in — 10 attempts per 15 minutes per IP
  const signInLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts, please try again later." },
  });

  app.post("/api/auth/sign-in/email", signInLimiter);
  app.use("/api/auth", authLimiter);
}

// better-auth handles its own body parsing — mount before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.use("/api", sampleRoutes);
app.use("/api/users", usersRoutes);

// Protected health endpoint — no infrastructure details exposed to unauthenticated callers
app.get("/api/health", requireAuth, async (_req, res, next) => {
  prisma.$queryRaw`SELECT 1`.then(() => res.json({ status: "ok" })).catch(next);
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

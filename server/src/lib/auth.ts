import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma.js";

const trustedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  session: {
    storeSessionInDatabase: true,
    cookieCache: { enabled: false },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "agent",
        input: false,
      },
    },
  },
  trustedOrigins: [trustedOrigin],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});
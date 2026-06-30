import { auth } from "../lib/auth.js";
import prisma from "../lib/prisma.js";

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  await auth.api.signUpEmail({
    body: { email, password, name },
  });

  await prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });

  console.log(`Admin created: ${email}`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

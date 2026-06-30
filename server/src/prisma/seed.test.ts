import { auth } from "../lib/auth.js";
import prisma from "../lib/prisma.js";

async function seedUser(
  email: string,
  password: string,
  name: string,
  role: "admin" | "agent"
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] ${role} already exists: ${email}`);
    return;
  }

  await auth.api.signUpEmail({ body: { email, password, name } });

  await prisma.user.update({
    where: { email },
    data: { role },
  });

  console.log(`[seed] Created ${role}: ${email}`);
}

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? "Admin";

  const agentEmail = process.env.AGENT_EMAIL;
  const agentPassword = process.env.AGENT_PASSWORD;
  const agentName = process.env.AGENT_NAME ?? "Agent";

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.test");
  }

  if (!agentEmail || !agentPassword) {
    throw new Error("AGENT_EMAIL and AGENT_PASSWORD must be set in .env.test");
  }

  await seedUser(adminEmail, adminPassword, adminName, "admin");
  await seedUser(agentEmail, agentPassword, agentName, "agent");

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

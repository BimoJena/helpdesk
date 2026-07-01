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

async function seedTickets() {
  const count = await prisma.ticket.count();
  if (count > 0) {
    console.log(`[seed] Tickets already exist, skipping.`);
    return;
  }

  await prisma.ticket.createMany({
    data: [
      {
        subject: "Cannot log in to my account",
        body: "Hi, I've been trying to log in for the past hour but keep getting an 'invalid credentials' error. I'm sure my password is correct. Please help!",
        senderEmail: "john.doe@example.com",
        senderName: "John Doe",
        status: "open",
        category: "technical_question",
      },
      {
        subject: "Request for refund on order #4821",
        body: "I would like to request a full refund for my recent purchase. The product did not match the description on the website.",
        senderEmail: "sarah.miller@example.com",
        senderName: "Sarah Miller",
        status: "open",
        category: "refund_request",
      },
      {
        subject: "How do I upgrade my plan?",
        body: "I'm currently on the basic plan and would like to know the steps to upgrade to the pro plan. Is there a discount for annual billing?",
        senderEmail: "carlos.ruiz@example.com",
        senderName: "Carlos Ruiz",
        status: "resolved",
        category: "general_question",
      },
      {
        subject: "API rate limit exceeded",
        body: "Our integration keeps hitting the rate limit even though we're well within the documented quota. Can you investigate?",
        senderEmail: "dev@techcorp.io",
        senderName: "TechCorp Dev Team",
        status: "open",
        category: "technical_question",
      },
      {
        subject: "Wrong item shipped",
        body: "I ordered the blue version but received the red one. Order number is #9034. Please advise on how to proceed.",
        senderEmail: "emily.watson@example.com",
        senderName: "Emily Watson",
        status: "closed",
        category: "refund_request",
      },
    ],
  });

  console.log(`[seed] Created 5 dummy tickets.`);
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

  await seedTickets();

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

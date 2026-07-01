import prisma from "../lib/prisma.js";

const tickets = [
  // --- technical_question ---
  { subject: "Cannot log in after password reset", senderName: "James Carter", senderEmail: "james.carter@gmail.com", status: "open", category: "technical_question", daysAgo: 1 },
  { subject: "API returns 500 on POST /orders", senderName: "Dev Team", senderEmail: "dev@shopwave.io", status: "open", category: "technical_question", daysAgo: 2 },
  { subject: "Mobile app crashes on iOS 17", senderName: "Priya Nair", senderEmail: "priya.nair@icloud.com", status: "open", category: "technical_question", daysAgo: 3 },
  { subject: "Two-factor authentication not sending SMS", senderName: "Marco Rossi", senderEmail: "marco.rossi@libero.it", status: "resolved", category: "technical_question", daysAgo: 5 },
  { subject: "Dashboard charts not loading in Firefox", senderName: "Aisha Okonkwo", senderEmail: "aisha.o@outlook.com", status: "open", category: "technical_question", daysAgo: 6 },
  { subject: "Webhook events not being delivered", senderName: "Backend Team", senderEmail: "backend@finpulse.dev", status: "open", category: "technical_question", daysAgo: 7 },
  { subject: "CSV export produces corrupted file", senderName: "Linda Hoffmann", senderEmail: "linda.hoffmann@web.de", status: "resolved", category: "technical_question", daysAgo: 10 },
  { subject: "OAuth login with Google fails silently", senderName: "Tom Nguyen", senderEmail: "tom.nguyen@yahoo.com", status: "open", category: "technical_question", daysAgo: 12 },
  { subject: "Search returns no results for valid queries", senderName: "Fatima Al-Rashid", senderEmail: "fatima.r@hotmail.com", status: "closed", category: "technical_question", daysAgo: 14 },
  { subject: "Email notifications stopped arriving", senderName: "Carlos Mendez", senderEmail: "c.mendez@empresa.mx", status: "open", category: "technical_question", daysAgo: 15 },
  { subject: "File upload stuck at 99%", senderName: "Sophie Dubois", senderEmail: "sophie.dubois@orange.fr", status: "open", category: "technical_question", daysAgo: 16 },
  { subject: "Rate limit hit despite low usage", senderName: "Infra Team", senderEmail: "infra@cloudnest.io", status: "resolved", category: "technical_question", daysAgo: 18 },
  { subject: "Session expires too quickly", senderName: "Yuki Tanaka", senderEmail: "yuki.tanaka@docomo.ne.jp", status: "open", category: "technical_question", daysAgo: 20 },
  { subject: "PDF generation fails for large reports", senderName: "Robert Klein", senderEmail: "r.klein@gmx.de", status: "open", category: "technical_question", daysAgo: 22 },
  { subject: "Pagination breaks on page 3", senderName: "Amara Diallo", senderEmail: "amara.diallo@gmail.com", status: "resolved", category: "technical_question", daysAgo: 25 },
  { subject: "Dark mode toggle not persisting", senderName: "Lena Petrov", senderEmail: "lena.petrov@mail.ru", status: "closed", category: "technical_question", daysAgo: 28 },
  { subject: "Bulk delete only removes first item", senderName: "Ethan Brooks", senderEmail: "ethan.brooks@proton.me", status: "open", category: "technical_question", daysAgo: 30 },
  { subject: "Timezone mismatch in scheduled reports", senderName: "Mei Lin", senderEmail: "mei.lin@163.com", status: "open", category: "technical_question", daysAgo: 33 },
  { subject: "SSO integration broken after update", senderName: "IT Department", senderEmail: "it@globalcorp.com", status: "open", category: "technical_question", daysAgo: 35 },
  { subject: "Drag and drop not working on Chrome", senderName: "Nina Johansson", senderEmail: "nina.j@telia.se", status: "resolved", category: "technical_question", daysAgo: 38 },
  { subject: "Real-time updates stopped after reconnect", senderName: "Omar Hassan", senderEmail: "omar.hassan@gmail.com", status: "open", category: "technical_question", daysAgo: 40 },
  { subject: "Image thumbnails not generating", senderName: "Isabella Ferreira", senderEmail: "isa.ferreira@uol.com.br", status: "closed", category: "technical_question", daysAgo: 42 },
  { subject: "Account merge causing duplicate entries", senderName: "David Park", senderEmail: "david.park@kakao.com", status: "open", category: "technical_question", daysAgo: 45 },
  { subject: "Stripe payment form not loading", senderName: "Claire Moreau", senderEmail: "claire.moreau@sfr.fr", status: "resolved", category: "technical_question", daysAgo: 48 },
  { subject: "Custom domain SSL certificate error", senderName: "Ops Team", senderEmail: "ops@startupxyz.com", status: "open", category: "technical_question", daysAgo: 50 },

  // --- refund_request ---
  { subject: "Refund for duplicate charge on invoice #8821", senderName: "Sarah Miller", senderEmail: "sarah.miller@gmail.com", status: "open", category: "refund_request", daysAgo: 1 },
  { subject: "Wrong item delivered — order #3047", senderName: "Emily Watson", senderEmail: "emily.watson@hotmail.com", status: "closed", category: "refund_request", daysAgo: 3 },
  { subject: "Subscription charged after cancellation", senderName: "Ahmed Khalil", senderEmail: "ahmed.khalil@yahoo.com", status: "open", category: "refund_request", daysAgo: 4 },
  { subject: "Product arrived damaged — request refund", senderName: "Hana Müller", senderEmail: "hana.mueller@t-online.de", status: "resolved", category: "refund_request", daysAgo: 7 },
  { subject: "Annual plan refund — cancelling within 14 days", senderName: "Lucas Oliveira", senderEmail: "lucas.oliveira@gmail.com", status: "open", category: "refund_request", daysAgo: 9 },
  { subject: "Charged twice for same order", senderName: "Grace Kim", senderEmail: "grace.kim@naver.com", status: "resolved", category: "refund_request", daysAgo: 11 },
  { subject: "Item never arrived — order #5512", senderName: "Pierre Lefebvre", senderEmail: "pierre.lefebvre@laposte.net", status: "open", category: "refund_request", daysAgo: 13 },
  { subject: "Refund for unused credits on closed account", senderName: "Zara Ahmed", senderEmail: "zara.ahmed@outlook.com", status: "closed", category: "refund_request", daysAgo: 17 },
  { subject: "Wrong size shipped — need refund or exchange", senderName: "Ben Thompson", senderEmail: "ben.t@icloud.com", status: "open", category: "refund_request", daysAgo: 19 },
  { subject: "Promotional discount not applied at checkout", senderName: "Valentina Cruz", senderEmail: "val.cruz@gmail.com", status: "resolved", category: "refund_request", daysAgo: 21 },
  { subject: "Refund for event ticket — event cancelled", senderName: "Kwame Asante", senderEmail: "kwame.asante@gmail.com", status: "open", category: "refund_request", daysAgo: 24 },
  { subject: "Overcharged due to currency conversion error", senderName: "Ingrid Larsen", senderEmail: "ingrid.larsen@gmail.no", status: "open", category: "refund_request", daysAgo: 26 },
  { subject: "Partial refund for missing items in order #7731", senderName: "Raj Patel", senderEmail: "raj.patel@rediffmail.com", status: "resolved", category: "refund_request", daysAgo: 29 },
  { subject: "Charged for plan I downgraded from", senderName: "Chloe Martin", senderEmail: "chloe.martin@free.fr", status: "open", category: "refund_request", daysAgo: 32 },
  { subject: "Refund request — product not as described", senderName: "Samuel Osei", senderEmail: "samuel.osei@yahoo.com", status: "closed", category: "refund_request", daysAgo: 36 },
  { subject: "Trial converted to paid without notice", senderName: "Nadia Volkov", senderEmail: "nadia.volkov@yandex.ru", status: "open", category: "refund_request", daysAgo: 39 },
  { subject: "Refund for software licence — never activated", senderName: "Jack Wilson", senderEmail: "jack.wilson@btinternet.com", status: "resolved", category: "refund_request", daysAgo: 43 },
  { subject: "Duplicate subscription after account migration", senderName: "Yuna Choi", senderEmail: "yuna.choi@daum.net", status: "open", category: "refund_request", daysAgo: 46 },
  { subject: "Refund for training course — couldn't attend", senderName: "Fernando Gomes", senderEmail: "f.gomes@bol.com.br", status: "closed", category: "refund_request", daysAgo: 52 },
  { subject: "Charged full price despite student discount", senderName: "Mia Schneider", senderEmail: "mia.schneider@gmx.at", status: "open", category: "refund_request", daysAgo: 55 },

  // --- general_question ---
  { subject: "How do I upgrade to the Pro plan?", senderName: "Carlos Ruiz", senderEmail: "carlos.ruiz@gmail.com", status: "resolved", category: "general_question", daysAgo: 2 },
  { subject: "What are your support hours?", senderName: "Amelia Johnson", senderEmail: "amelia.j@outlook.com", status: "closed", category: "general_question", daysAgo: 4 },
  { subject: "Can I have multiple users on one account?", senderName: "Hiroshi Yamamoto", senderEmail: "h.yamamoto@gmail.com", status: "resolved", category: "general_question", daysAgo: 6 },
  { subject: "Is there a free tier available?", senderName: "Blessing Eze", senderEmail: "blessing.eze@yahoo.com", status: "closed", category: "general_question", daysAgo: 8 },
  { subject: "How do I export my data?", senderName: "Anna Kowalski", senderEmail: "anna.kowalski@wp.pl", status: "resolved", category: "general_question", daysAgo: 10 },
  { subject: "Do you offer GDPR data processing agreements?", senderName: "Legal Team", senderEmail: "legal@eurocorp.de", status: "open", category: "general_question", daysAgo: 11 },
  { subject: "What payment methods do you accept?", senderName: "Tariq Mahmood", senderEmail: "tariq.m@hotmail.com", status: "closed", category: "general_question", daysAgo: 13 },
  { subject: "Can I pause my subscription instead of cancelling?", senderName: "Rosa Hernandez", senderEmail: "rosa.h@gmail.com", status: "resolved", category: "general_question", daysAgo: 15 },
  { subject: "Is there an Android app available?", senderName: "Kwabena Mensah", senderEmail: "kwabena.m@gmail.com", status: "closed", category: "general_question", daysAgo: 17 },
  { subject: "How long is data retained after account deletion?", senderName: "Privacy Officer", senderEmail: "privacy@healthtech.eu", status: "open", category: "general_question", daysAgo: 19 },
  { subject: "Do you have an affiliate programme?", senderName: "Jake Turner", senderEmail: "jake.turner@proton.me", status: "resolved", category: "general_question", daysAgo: 21 },
  { subject: "Can I white-label the product?", senderName: "Sales Enquiry", senderEmail: "sales@agencygroup.co.uk", status: "open", category: "general_question", daysAgo: 23 },
  { subject: "What is your uptime SLA?", senderName: "CTO Office", senderEmail: "cto@fintech-startup.com", status: "resolved", category: "general_question", daysAgo: 26 },
  { subject: "How do I invite team members?", senderName: "Olga Ivanova", senderEmail: "olga.ivanova@mail.ru", status: "closed", category: "general_question", daysAgo: 28 },
  { subject: "Is there a bulk discount for 50+ seats?", senderName: "Procurement", senderEmail: "procurement@bigretail.com", status: "open", category: "general_question", daysAgo: 31 },
  { subject: "Can I integrate with Zapier?", senderName: "Maria Santos", senderEmail: "maria.santos@gmail.com", status: "resolved", category: "general_question", daysAgo: 34 },
  { subject: "Where can I find the API documentation?", senderName: "Dev Intern", senderEmail: "intern@devshop.io", status: "closed", category: "general_question", daysAgo: 37 },
  { subject: "Do you support SAML-based SSO?", senderName: "Enterprise IT", senderEmail: "it@enterprise500.com", status: "open", category: "general_question", daysAgo: 40 },
  { subject: "How do I change the account owner?", senderName: "Tobias Braun", senderEmail: "tobias.braun@web.de", status: "resolved", category: "general_question", daysAgo: 44 },
  { subject: "Is there a sandbox environment for testing?", senderName: "QA Team", senderEmail: "qa@softwarehouse.pl", status: "open", category: "general_question", daysAgo: 47 },
  { subject: "What happens to my data if I downgrade?", senderName: "Chioma Obi", senderEmail: "chioma.obi@gmail.com", status: "closed", category: "general_question", daysAgo: 50 },
  { subject: "Can I get an invoice for my last payment?", senderName: "Finance Dept", senderEmail: "finance@consultingfirm.com", status: "resolved", category: "general_question", daysAgo: 53 },
  { subject: "Do you offer onboarding assistance?", senderName: "New Customer", senderEmail: "hello@newbiz.co", status: "open", category: "general_question", daysAgo: 56 },
  { subject: "How do I delete my account permanently?", senderName: "Ex User", senderEmail: "leaving@example.com", status: "resolved", category: "general_question", daysAgo: 60 },
  { subject: "Is the product SOC 2 certified?", senderName: "Security Team", senderEmail: "security@insurancegroup.com", status: "open", category: "general_question", daysAgo: 63 },
  { subject: "Can I use my own SMTP server for emails?", senderName: "Sys Admin", senderEmail: "admin@selfhosted.org", status: "resolved", category: "general_question", daysAgo: 66 },
  { subject: "What currencies do you support for billing?", senderName: "Accounts", senderEmail: "accounts@globaltrading.net", status: "closed", category: "general_question", daysAgo: 70 },
  { subject: "Is there a changelog or release notes page?", senderName: "Power User", senderEmail: "poweruser@techblog.dev", status: "resolved", category: "general_question", daysAgo: 75 },
  { subject: "How do I set up custom roles and permissions?", senderName: "HR Systems", senderEmail: "hr-systems@bigcompany.com", status: "open", category: "general_question", daysAgo: 80 },
  { subject: "Can I schedule automated backups?", senderName: "Backup Admin", senderEmail: "backup@datacentre.eu", status: "resolved", category: "general_question", daysAgo: 85 },

  // --- null category (uncategorised) ---
  { subject: "Just wanted to say the product is amazing!", senderName: "Happy Customer", senderEmail: "happy@customer.com", status: "closed", category: null, daysAgo: 2 },
  { subject: "Feedback on the new UI redesign", senderName: "Ling Wei", senderEmail: "ling.wei@qq.com", status: "closed", category: null, daysAgo: 8 },
  { subject: "Suggestion: add keyboard shortcuts", senderName: "Power User", senderEmail: "shortcuts@devtools.io", status: "open", category: null, daysAgo: 14 },
  { subject: "Accessibility issues with screen reader", senderName: "Accessibility Advocate", senderEmail: "a11y@nonprofit.org", status: "open", category: null, daysAgo: 20 },
  { subject: "Wrong country listed on my profile", senderName: "Dmitri Sokolov", senderEmail: "dmitri.s@yandex.ru", status: "resolved", category: null, daysAgo: 27 },
];

async function seed() {
  const existing = await prisma.ticket.count();
  if (existing >= 100) {
    console.log(`[seed] ${existing} tickets already exist, skipping.`);
    process.exit(0);
  }

  const now = new Date();

  await prisma.ticket.createMany({
    data: tickets.map(({ daysAgo, ...t }) => ({
      ...t,
      body: `[seeded] ${t.subject}`,
      createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000),
    })),
    skipDuplicates: true,
  });

  console.log(`[seed] Created ${tickets.length} tickets.`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

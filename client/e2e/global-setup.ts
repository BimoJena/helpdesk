import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, "../../server");

// Load test env vars from server/.env.test
dotenv.config({ path: path.resolve(serverDir, ".env.test") });

const TEST_DATABASE_URL = process.env.DATABASE_URL;
if (!TEST_DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in server/.env.test");
}

// Derive a connection to the default `postgres` DB for administrative tasks (CREATE DATABASE)
const adminUrl = new URL(TEST_DATABASE_URL);
const TEST_DB_NAME = adminUrl.pathname.replace("/", "");
adminUrl.pathname = "/postgres";
const ADMIN_DB_URL = adminUrl.toString();

async function createTestDatabase() {
  const client = new pg.Client({ connectionString: ADMIN_DB_URL });
  await client.connect();

  const res = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [TEST_DB_NAME]
  );

  if (res.rowCount === 0) {
    await client.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
    console.log(`[setup] Created database: ${TEST_DB_NAME}`);
  } else {
    console.log(`[setup] Database already exists: ${TEST_DB_NAME}`);
  }

  await client.end();
}

async function runMigrations() {
  console.log("[setup] Running Prisma migrations on test database...");
  execSync("bun --bun run prisma migrate deploy", {
    cwd: serverDir,
    stdio: "inherit",
    env: { ...process.env },
  });
  console.log("[setup] Migrations complete.");
}

async function seedTestUsers() {
  console.log("[setup] Seeding test users...");
  execSync("bun --env-file=.env.test src/prisma/seed.test.ts", {
    cwd: serverDir,
    stdio: "inherit",
    env: { ...process.env },
  });
  console.log("[setup] Seeding complete.");
}

async function resetDatabase() {
  const client = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();

  await client.query(`
    TRUNCATE TABLE
      "Message",
      "Session",
      "Account",
      "Verification",
      "Ticket",
      "User"
    RESTART IDENTITY CASCADE
  `);

  console.log("[setup] Database reset complete.");
  await client.end();
}

export default async function globalSetup() {
  await createTestDatabase();
  await runMigrations();
  await resetDatabase();
  await seedTestUsers();
}

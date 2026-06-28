# Helpdesk - AI-Powered Ticket Management System

## Project Overview

A ticket management system that uses AI to classify, respond to, and route support tickets. See `project-scope.md` for full requirements and `implementation-plan.md` for phased task breakdown.

## Tech Stack

- **Frontend**: React + TypeScript + Vite (port 5173) + shadcn/ui
- **Backend**: Express + TypeScript + Bun (port 3000)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-5 Nano via Vercel AI SDK (`@ai-sdk/openai`)
- **Auth**: Better Auth (email/password, database sessions)

## Project Structure

```
/core     - Shared code (Zod schemas, types) — Bun workspace package
/client   - React frontend (Vite)
```

## Development

```bash
# Start server
cd server && bun run dev

# Start client
cd client && bun run dev
```

The client proxies `/api/*` requests to the server via Vite config.

## Key Conventions

- Use Bun as the runtime and package manager (not npm/yarn)
- Use TypeScript throughout
- Use context7 MCP server to fetch up-to-date documentation for libraries
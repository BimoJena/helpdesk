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

## shadcn/ui Setup (client)

- Config: `client/components.json`, style: `default`, baseColor: `slate`, CSS variables enabled
- Path alias `@/` → `src/` (set in `vite.config.ts` and `tsconfig.json`)
- Theme CSS variables defined in `src/index.css` (light + dark)
- `cn()` utility at `src/lib/utils.ts`
- Components live in `src/components/ui/`
- Existing components: `button`, `input`, `label`, `card`
- Add new components with: `cd client && bunx shadcn add <component>`
- Always use semantic color tokens (`bg-primary`, `text-destructive`, `bg-muted`, etc.) — never hardcode Tailwind colors like `blue-600` or `gray-300`

## Authentication

### Library: Better Auth
- Server: `server/src/lib/auth.ts` — configured with Prisma adapter (PostgreSQL), email/password enabled, database sessions
- Client: `client/src/lib/authClient.ts` — `createAuthClient({ baseURL: 'http://localhost:3000' })`
- Auth routes are mounted at `/api/auth/*` on the Express server
- Trusted origin: `http://localhost:5173`
- Secure cookies only in production

### User Roles
- Defined as a Prisma enum: `admin` | `agent`
- Stored as `role` field on the `User` model (default: `agent`)
- Added to Better Auth as an `additionalField` (not user-settable via input)

### Server Middleware (`server/src/middleware/auth.middleware.ts`)
- `requireAuth` — verifies session, attaches `req.user` and `req.session`, returns 401 if missing
- `requireAdmin` — same as above but also checks `req.user.role === 'admin'`, returns 403 if not
- Both use `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })`
- `req.user` and `req.session` types are globally declared in `server/src/types/express.d.ts`

### Client Usage
- Sign in: `authClient.signIn.email({ email, password })`
- Sign out: `authClient.signOut()`
- Get session: `authClient.useSession()` (React hook)
- All return `{ data, error }` — always check `error` before proceeding

### Database Models
- `User` — id, name, email, emailVerified, image, role, timestamps
- `Session` — id, expiresAt, token, userId, timestamps
- `Account` — for OAuth providers (currently unused)
- `Verification` — for email verification flows (currently unused)

## Completed Pages


- `LoginPage.tsx` — email/password login using Card, Label, Input, Button; validation via zod + react-hook-form; auth via better-auth `authClient.signIn.email()`

## Key Conventions

- Use Bun as the runtime and package manager (not npm/yarn)
- Use TypeScript throughout
- Use context7 MCP server to fetch up-to-date documentation for libraries
- Use shadcn/ui components for all UI — no raw HTML form elements or hardcoded colors
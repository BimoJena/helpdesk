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

### Client-side Role Enforcement
- `authClient` uses `inferAdditionalFields<typeof auth>()` plugin to type the `role` field on `session.user`
- Admin-only routes in `App.tsx` check `session.user.role === 'admin'` and redirect non-admins to `/`

## Completed Pages

- `LoginPage.tsx` — email/password login using Card, Label, Input, Button; validation via zod + react-hook-form; auth via better-auth `authClient.signIn.email()`
- `HomePage.tsx` — dashboard, accessible to all authenticated users
- `UsersPage.tsx` — admin-only page at `/users`

## Shared Components

- `AppLayout.tsx` — shared nav + layout wrapper used by all authenticated pages; renders a "Users" nav link only for admins

## Seed / Test Users

- Admin: set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars, seeded with `bun run db:seed`
- Agent: `agent@example.com` / `password123`

## Testing

### Strategy
- **Prefer component (unit) tests** for all UI logic — rendering, state, user interactions, API mocking, error/loading states
- **Use E2E tests only when necessary** — full auth flows, multi-page navigation, or behaviour that cannot be meaningfully tested without a real browser + real server (e.g. cookie-based session persistence, redirect chains)
- When in doubt, write a component test first; only escalate to E2E if the component test cannot cover the scenario

### Component Tests (Vitest)
- Runner: Vitest with jsdom environment
- Tests live in `client/src/test/`
- Run with: `cd client && bun run test:unit` (headless), `bun run test:unit:ui` (UI mode)
- Setup file: `client/src/test/setup.ts` (imports `@testing-library/jest-dom`)
- Use `@testing-library/react` + `@testing-library/user-event` for rendering and interactions
- Wrap components in `<QueryClientProvider>` (with `retry: false`) and `<MemoryRouter>` as needed
- Mock `axios` with `vi.hoisted` + `vi.mock` to intercept API calls; mock `authClient` for session state
- Scope queries to `<tbody>` via `screen.getAllByRole('rowgroup')[1]` to avoid collisions with nav/header

### E2E Tests (Playwright)
- Installed in `client/` as a dev dependency
- Config: `client/playwright.config.ts`
- Tests live in `client/e2e/`
- Run with: `cd client && bun run test:e2e` (headless), `bun run test:e2e:ui` (UI mode), `bun run test:e2e:debug` (debug)
- Only Chromium is configured; add more browsers in `playwright.config.ts` if needed
- Use Playwright's `request` fixture (not the browser) for pure API/webhook tests

### Test Database
- Separate PostgreSQL database: `helpdesk_test`
- Server runs on port `3001` with env vars from `server/.env.test`
- Vite runs on port `5174` with `VITE_TEST=true` (proxies `/api` to port `3001`)
- Both servers are auto-started by Playwright via `webServer` in the config
- `global-setup.ts` — creates `helpdesk_test` if it doesn't exist, then runs `prisma migrate deploy` against it
- `global-teardown.ts` — truncates all tables (RESTART IDENTITY CASCADE) after tests; database is kept persistent so it's always visible in DataGrip
- `helpdesk_test` must be created on first run via `bun run test:e2e`

### Rate Limiting
- Auth rate limiters (`authLimiter`, `signInLimiter`) only apply when `NODE_ENV=production`
- Bypassed in dev and test environments to avoid interference during development and E2E tests

## Key Conventions

- Use Bun as the runtime and package manager (not npm/yarn)
- Use TypeScript throughout
- Use context7 MCP server to fetch up-to-date documentation for libraries
- Use shadcn/ui components for all UI — no raw HTML form elements or hardcoded colors
- Use axios for all HTTP requests on the client — create an axios instance with `baseURL` and `withCredentials: true`; use `axios.isAxiosError()` for error handling
- Use TanStack Query for all server state on the client — `useQuery` for fetching, `useMutation` for writes; update the cache via `setQueryData` on success to avoid redundant refetches
- All error and response messages must be shown in a popup dialog box with an OK button — never use `alert()`, `confirm()`, or inline error text for API responses
# MalayMeta Translation Eval

A modular TypeScript Next.js 14 app for LLM translation annotation, built for multi-user performance.

## Stack

- **Next.js 14** App Router (TypeScript)
- **Tailwind CSS** — dark industrial theme, Syne + DM Sans + IBM Plex Mono fonts
- **PostgreSQL via `pg`** — direct pool connection to `data` schema (bypasses Supabase JS client limitations)
- **`jose`** — lightweight JWT sessions via httpOnly cookies
- **Middleware** — server-side route protection (no flicker, no client-side guard)

## Multi-user Architecture

| Concern | Solution |
|---|---|
| DB connections | Singleton `pg.Pool` (max 20 connections), reused across requests |
| Sessions | httpOnly JWT cookie (8h), no shared memory, safe for horizontal scaling |
| Data isolation | All queries filter by `username` from session; task ownership verified on PATCH |
| Performance | Server components render task list at request time; only interactive parts are client components |

## Setup

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, DOT_CLIENT_ID, DOT_CLIENT_SECRET, JWT_SECRET

npm install
npm run dev
```

## Supabase / PostgreSQL Note

The app uses the `pg` driver directly (not the Supabase JS client) so queries like:
```sql
SELECT * FROM data.annotation_tasks WHERE username = $1
```
work correctly against the `data` schema without any schema search path issues.

**Recommended**: Use Supabase's **Transaction Pooler** connection string (port 6543) for production, which supports many concurrent connections efficiently.

## Project Structure

```
app/
  api/
    auth/login/     POST  — authenticate via DOT, set JWT cookie
    auth/logout/    POST  — clear cookie
    auth/me/        GET   — return current session user
    tasks/          GET   — list tasks for current user
    tasks/[id]/     GET   — get task detail
                    PATCH — submit annotation
  login/            Login page
  tasks/            Task list (server component)
  tasks/[id]/       Task detail (server component + client interactive)
components/
  Navbar.tsx
  TaskCard.tsx
  ModelRatingTab.tsx
lib/
  db.ts             Singleton pg Pool + query helpers
  auth.ts           JWT create/verify + session cookie
  tasks.ts          Data access layer
types/
  index.ts          Task types + MODEL_MAP
middleware.ts       Route protection
```

# Architecture Overview

## Monorepo layout

```
global-jobs-international/
├── client/     # React 19 + Vite frontend
├── server/     # Express + TypeScript API
├── shared/     # Shared types and contracts
└── docs/       # Project documentation
```

## Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Routing  | React Router                             |
| Data     | TanStack React Query, Supabase JS        |
| Forms    | React Hook Form + Zod                    |
| Motion   | Framer Motion                            |
| i18n     | i18next / react-i18next                  |
| Backend  | Node.js, Express, TypeScript             |
| Database | Supabase (Postgres + Auth)               |

## Request flow

1. The Vite client talks to the Express API under `/api`.
2. In development, Vite proxies `/api` to `http://localhost:3001`.
3. The server validates configuration with Zod and exposes health and future feature routes.
4. Supabase is used for persistence and authentication; the browser uses the anon key, the server uses the service role key when needed.

## Conventions

- Feature UI lives under `client/src/` (pages, components, hooks) — not scaffolded yet.
- API routes live under `server/src/routes/`.
- Cross-cutting types and API contracts live in `shared/src/`.
- Keep environment secrets out of git; copy `.env.example` files locally.

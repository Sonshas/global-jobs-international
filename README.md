# Global Jobs International

Production-ready foundation for a full-stack international jobs platform.

Global Jobs International connects talent with opportunities worldwide. This repository is an npm workspaces monorepo with a React frontend, Express API, shared TypeScript contracts, and Supabase as the data layer.

> **Status:** Project foundation only. Feature pages and domain APIs are not implemented yet.

## Tech stack

### Frontend (`client/`)

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack React Query
- React Hook Form + Zod
- Framer Motion
- i18next

### Backend (`server/`)

- Node.js + Express
- TypeScript
- Zod environment validation
- Helmet, CORS, Morgan

### Database

- Supabase (PostgreSQL, Auth, and client SDKs on both tiers)

### Tooling

- ESLint (flat config) + Prettier
- TypeScript project references / workspace builds
- Concurrently for local full-stack development

## Repository structure

```
global-jobs-international/
├── client/                 # Vite + React application
│   └── src/
│       ├── app/            # App shell and providers
│       ├── i18n/           # Internationalization setup
│       ├── lib/            # Client utilities (Supabase, etc.)
│       └── locales/        # Translation files
├── server/                 # Express API
│   └── src/
│       ├── config/         # Environment and configuration
│       ├── lib/            # Server utilities (Supabase admin)
│       ├── middleware/     # Error and 404 handlers
│       └── routes/         # API routes
├── shared/                 # Shared types and API contracts
├── docs/                   # Architecture and setup docs
├── eslint.config.js
├── .prettierrc
└── package.json            # Workspace root
```

## Prerequisites

- Node.js **20+**
- npm **10+**
- A [Supabase](https://supabase.com) project

## Quick start

```bash
# Install dependencies (all workspaces)
npm install

# Configure environment
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env

# Build shared contracts (required before server start)
npm run build:shared

# Run client + server
npm run dev
```

| Service    | URL                              |
| ---------- | -------------------------------- |
| Frontend   | http://localhost:5173            |
| API health | http://localhost:3001/api/health |

Update the `.env` files with your Supabase URL and keys before enabling auth or database features.

## Database (Supabase)

PostgreSQL migrations live in [`supabase/migrations`](./supabase/migrations).

See [docs/database-schema.md](./docs/database-schema.md) for the entity model, relationships, and how to apply migrations.

## Authentication (Supabase)

Email/password auth is wired in the React client.

1. Copy `client/.env.example` → `client/.env`
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. In Supabase Auth URL config, allow:
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/auth/reset-password`

See [docs/authentication.md](./docs/authentication.md) for routes and flows.

Smoke test (after env is set):

```bash
node --env-file=client/.env client/scripts/verify-auth.mjs
```

## Scripts

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start client and server in parallel |
| `npm run dev:client`   | Start Vite only                     |
| `npm run dev:server`   | Start Express only                  |
| `npm run build`        | Build shared → server → client      |
| `npm run lint`         | Lint the monorepo with ESLint       |
| `npm run lint:fix`     | Lint and auto-fix                   |
| `npm run format`       | Format with Prettier                |
| `npm run format:check` | Check Prettier formatting           |
| `npm run typecheck`    | Type-check all workspaces           |

## Environment variables

See [`.env.example`](./.env.example), [`client/.env.example`](./client/.env.example), and [`server/.env.example`](./server/.env.example).

| Variable                    | Used by | Purpose                    |
| --------------------------- | ------- | -------------------------- |
| `VITE_API_URL`              | Client  | Base URL for API requests  |
| `VITE_SUPABASE_URL`         | Client  | Supabase project URL       |
| `VITE_SUPABASE_ANON_KEY`    | Client  | Public anon key            |
| `PORT`                      | Server  | API port (default `3001`)  |
| `CLIENT_ORIGIN`             | Server  | Allowed CORS origin        |
| `SUPABASE_URL`              | Server  | Supabase project URL       |
| `SUPABASE_SERVICE_ROLE_KEY` | Server  | Privileged server-side key |

Never commit real secrets. The service role key must remain server-only.

## Documentation

- [Getting started](./docs/getting-started.md)
- [Architecture](./docs/architecture.md)

## License

Proprietary — All rights reserved.

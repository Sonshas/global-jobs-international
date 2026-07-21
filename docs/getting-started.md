# Getting Started

## Prerequisites

- Node.js 20+
- npm 10+
- A Supabase project (URL + anon key + service role key)

## Setup

1. From the repository root:

   ```bash
   npm install
   ```

2. Copy environment templates:

   ```bash
   cp .env.example .env
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   ```

3. Fill in Supabase and API values in those files.

4. Build the shared package once:

   ```bash
   npm run build:shared
   ```

5. Start development servers:

   ```bash
   npm run dev
   ```

- Client: http://localhost:5173
- API health: http://localhost:3001/api/health

## Useful scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Run client and server together   |
| `npm run build`     | Build shared, server, and client |
| `npm run lint`      | Run ESLint across the monorepo   |
| `npm run format`    | Format with Prettier             |
| `npm run typecheck` | Type-check all workspaces        |

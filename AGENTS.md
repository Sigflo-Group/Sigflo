# Sigflo – Agent Instructions

## Overview

React 19 + TypeScript + Vite + Tailwind SPA for crypto trading signals. Core market data from Bybit public API (REST + WebSocket) directly from browser. Optional Express backend in `backend/` for exchange integrations (needs PostgreSQL). Hosted on Netlify with serverless functions for AI; backend deployed separately (Railway).

## Project structure

- **Root** — the actual frontend SPA (source of truth)
- **`frontend/`** — self-contained copy of the SPA used only by Docker (`docker-compose.yml` mounts `./frontend:/app`). Edit root files, not `frontend/` files.
- **`backend/`** — Express API, separate deploy, not wired through root `npm install` (has own `package.json`)
- **`netlify/functions/`** — Netlify serverless functions for AI suggest, news scan, admin beta

## Key commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on `:5173` (AI routes handled by Vite middleware instead of Netlify functions) |
| `npm run dev:backend` | Express backend via `tsx watch` on `:8787` |
| `npm run build` | `tsc -b && vite build` — required order |
| `npm test` | `vitest run` (single test file: `src/lib/__tests__/timingLifecycle.test.ts`) |
| `npm run lint` | ESLint 9 flat config; expects ~30 warnings (react-hooks/exhaustive-deps, react-refresh), 0 errors |

## Testing

- **Framework:** Vitest (configured in `vitest.config.ts`)
- **Run:** `npm test` or `npx vitest run`
- **Location:** `src/lib/__tests__/*.test.ts` (currently 1 file: `timingLifecycle.test.ts`)
- **Environment:** `node` (not jsdom)
- **No component/e2e tests exist** — validate UI changes via `npm run build` + manual browser testing

## Env & config quirks

- **`Vite allowedHosts`:** `vite.config.ts` sets `server.allowedHosts: true` for Cursor/proxy compat
- **Vite strictPort:** `true` — if port 5173 is taken, Vite errors rather than picking next port (Netlify Dev proxy would break)
- **Vite merges `backend/.env`** into dev middleware for AI env vars (see `vite.config.ts` `loadAiSecretsFromDisk`)
- **`OPENAI_API_KEY`** must not be an empty string in OS env — Vite prefers `process.env` over `.env.local` (workaround in `vite.config.ts`)
- **Subpath deploy:** set `VITE_BASE=/your/path/` (trailing `/` required); root `/` or unset for normal deploy
- **`FRONTEND_ORIGIN`** on backend controls CORS; comma-separated origins including all frontend hostnames

## Architecture notes

- **Signal engine runs client-side** in `SignalEngineContext.tsx` (no backend calls for core detection)
- **Bybit CORS:** browser may show feeds as offline — expected in some dev setups (bypass with Netlify Dev or Vite proxy)
- **Route splitting:** `app.sigflo.group` → feed at `/`; `sigflo.group` → landing at `/`; other hosts → feed at `/feed` (see `src/config/appRoutes.ts`)
- **AI routes** (`/api/ai/suggest`, `/api/ai/news-scan`, `/api/admin/beta`) are handled by Vite middleware in dev, Netlify functions in prod
- **Backend auth:** production uses `Authorization: Bearer <supabase_jwt>`; dev fallback with `VITE_DEV_USER_ID` when `SUPABASE_JWT_SECRET` is unset and `NODE_ENV != production`
- **Backend workers** (`exitAutomationWorker`, `opportunitySyncWorker`) start only after startup schema check passes — run migrations first

## Chart height rule (do not hardcode)

Trade chart plot heights live in `src/config/tradeChartHeights.ts` only. `ChartHeader`, `TradeScreen`, and `PriceChartCard` import those constants — do not reintroduce hardcoded values.

## Netlify deploy

- **Auto-deploy:** push to `main` triggers build
- **CLI:** `npm run build && npx netlify-cli deploy --prod --dir=dist --functions=netlify/functions`
- **Key env vars** (set in Netlify UI, never `VITE_*` for secrets): `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SIGFLO_BETA_ADMIN_EMAILS`
- **SPA catch-all** and API function redirects defined in `netlify.toml`

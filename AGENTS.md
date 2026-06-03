# Sigflo – Agent Instructions

## Overview

React 19 + TypeScript + Vite + Tailwind SPA for crypto trading signals. Core market data from Bybit public API (REST + WebSocket) directly from browser. Optional Express backend in `backend/` for exchange integrations (needs PostgreSQL). Hosted on Netlify with serverless functions for AI; backend deployed separately (Railway).

## Project structure

- **Root** — the actual frontend SPA (source of truth)
- **`backend/`** — Express API, separate deploy, not wired through root `npm install` (has own `package.json`)
- **`netlify/functions/`** — Netlify serverless functions for AI suggest, news scan, admin beta

## Key commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on `:5173` (AI routes handled by Vite middleware instead of Netlify functions) |
| `npm run dev:backend` | Express backend via `tsx watch` on `:8787` |
| `npm run build` | `tsc -b && vite build` — required order |
| `npm test` | `vitest run` (single test file: `src/lib/__tests__/timingLifecycle.test.ts`) |
| `npm run lint` | ESLint 9 flat config; expects ~60 warnings (react-hooks/exhaustive-deps, react-refresh), 0 errors |

## Testing

- **Framework:** Vitest (configured in `vitest.config.ts`)
- **Run:** `npm test` or `npx vitest run`
- **Location:** `src/lib/__tests__/*.test.ts` (currently 1 file: `timingLifecycle.test.ts`)
- **Environment:** `node` (not jsdom)
- **Test files:** `src/lib/__tests__/engineUtils.test.ts`, `src/lib/__tests__/engineStorage.test.ts`, `src/lib/__tests__/timingLifecycle.test.ts`
- **No component/e2e tests exist** — validate UI changes via `npm run build` + manual browser testing

## Docker

Docker compose mounts root source files directly into the container — no frontend/ sync needed. Run:
- `npm run docker:up` — start dev containers
- `npm run docker:up:build` — rebuild and start

## Env & config quirks

- **`Vite allowedHosts`:** `vite.config.ts` sets `server.allowedHosts: true` for Cursor/proxy compat
- **Vite strictPort:** `true` — if port 5173 is taken, Vite errors rather than picking next port (Netlify Dev proxy would break)
- **Vite merges `backend/.env`** into dev middleware for AI env vars (see `vite.config.ts` `loadAiSecretsFromDisk`)
- **`OPENAI_API_KEY`** must not be an empty string in OS env — Vite prefers `process.env` over `.env.local` (workaround in `vite.config.ts`)
- **Subpath deploy:** set `VITE_BASE=/your/path/` (trailing `/` required); root `/` or unset for normal deploy
- **`FRONTEND_ORIGIN`** on backend controls CORS; comma-separated origins including all frontend hostnames

## Architecture notes

- **Signal engine runs client-side** in `SignalEngineContext.tsx` (no backend calls for core detection). Engine utilities extracted to `src/lib/engineUtils.ts` (candle helpers, key generation) and `src/lib/engineStorage.ts` (localStorage persistence helpers).
- **Bybit CORS:** browser may show feeds as offline — expected in some dev setups (bypass with Netlify Dev or Vite proxy)
- **Route splitting:** `app.sigflo.group` → feed at `/`; `sigflo.group` → landing at `/`; other hosts → feed at `/feed` (see `src/config/appRoutes.ts`)
- **AI routes** (`/api/ai/suggest`, `/api/ai/news-scan`, `/api/admin/beta`) are handled by Vite middleware in dev, Netlify functions in prod
- **Backend auth:** production uses `Authorization: Bearer <supabase_jwt>`; dev fallback with `VITE_DEV_USER_ID` when `SUPABASE_JWT_SECRET` is unset and `NODE_ENV != production`
- **Backend workers** (`exitAutomationWorker`, `opportunitySyncWorker`) start only after startup schema check passes — run migrations first

## Chart height rule (do not hardcode)

Trade chart plot heights live in `src/config/tradeChartHeights.ts` only. `ChartHeader`, `TradeScreen`, and `PriceChartCard` import those constants — do not reintroduce hardcoded values.

## Slack bridge

A polling-based Slack DM bridge connects this session to Slack. When the user DMs `@opencode-link` in Slack, the message lands in `/tmp/slack-messages.jsonl` (appended as JSON lines). A background process (`slack-poll.mjs`) polls `conversations.history` every 2s and auto-replies "Got it!" as a read receipt. Reply to the user via `slack_slack_post_message` to their DM channel `REDACTED`.

Key files:
- `slack-poll.mjs` — background polling bridge (start before session, uses `SLACK_BOT_TOKEN`)
- `opencode.json` — MCP server config for Slack tools
- `.opencode/opencode-link.json` — (deprecated) was for opencode-link plugin, no longer used

The polling bridge must be running for messages to be detected. Start it with:
```
SLACK_BOT_TOKEN="xoxb-..." nohup node /root/Sigflo/slack-poll.mjs > /dev/null 2>&1 & disown
```

A companion watcher (`slack-watch.mjs`) writes the latest DM text to `/tmp/slack-alert` on new messages. Check that file to see if the user has messaged.

## WhatsApp bridge

A Baileys-based WhatsApp bridge (`whatsapp-poll.mjs`) polls for incoming messages and outgoing send requests. On first run, it generates a QR code (saved as `/tmp/whatsapp-qr.png`) or pairing code (saved to `/tmp/whatsapp-pairing-code`) that must be used with the user's phone to link the session. Set `WHATSAPP_PHONE` env var to use pairing code mode (QR otherwise).

**Files:**
- `whatsapp-poll.mjs` — main bridge (Baileys WhatsApp Web client)
- `whatsapp-auth/` — auth state directory (persisted WhatsApp session)
- `/tmp/whatsapp-messages.jsonl` — incoming DMs (same format as Slack)
- `/tmp/whatsapp-send.jsonl` — outgoing messages to send `{"to": "...@s.whatsapp.net", "text": "..."}`
- `/tmp/whatsapp-qr.png` — QR code image for first-time auth
- `/tmp/whatsapp-pairing-code` — pairing code for phone number linking

To reply to a WhatsApp user, write to `/tmp/whatsapp-send.jsonl`:
```
echo '{"to":"1234567890@s.whatsapp.net","text":"Hello"}' >> /tmp/whatsapp-send.jsonl
```

The user's WhatsApp number must be known after they first message the bridge. User's number: REDACTED.

Start it with (pairing code mode):
```
SLACK_BOT_TOKEN="" WHATSAPP_PHONE=REDACTED nohup node /root/Sigflo/whatsapp-poll.mjs > /tmp/whatsapp-bridge.log 2>&1 &
```

## Netlify deploy

- **Auto-deploy:** push to `main` triggers build
- **CLI:** `npm run build && npx netlify-cli deploy --prod --dir=dist --functions=netlify/functions`
- **Key env vars** (set in Netlify UI, never `VITE_*` for secrets): `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SIGFLO_BETA_ADMIN_EMAILS`
- **SPA catch-all** and API function redirects defined in `netlify.toml`

## Cursor Cloud specific instructions

- **Node:** Use Node 20+ (`.nvmrc` pins 22). Root deps only: `npm install` at repo root; `backend/` has its own `package.json` — run `npm install` there only when working on the Express API.
- **Dev server:** `npm run dev` binds **5173** with `strictPort: true` — do not pick another port. Use a tmux session for long-running Vite (e.g. session name `vite-dev-server`). AI routes are served by Vite middleware in dev (not a separate process).
- **Localhost routes:** On non-`app.sigflo.group` hosts, the feed lives at **`/feed`** (not `/`). Public pages that work **without** Supabase: `/legal`, `/disclosure`, `/terms`, `/privacy`.
- **Supabase required for trading UI:** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` (or VM secrets). Without them, `LoginScreen` redirects to `/feed` while `ProtectedRoute` sends unauthenticated users back to `/login`, causing a **render loop** (black screen) on `/login` and `/feed`. Do not use those paths for smoke tests until Supabase is configured.
- **Bybit from the VM:** Direct `fetch` to `api.bybit.com` may be **geo-blocked** (CloudFront) on some cloud regions; the in-browser app may still behave differently. If feeds show offline, try Netlify Dev or document regional limits — not necessarily a code defect.
- **Backend / exchange E2E:** Requires `npm run dev:backend` (port **8787**), Postgres (`backend/migrations/`), and `backend/.env`. See `README.md` for `VITE_BACKEND_API_BASE` and `VITE_DEV_USER_ID` dev fallback.
- **Lint / test / build:** `npm run lint` (expect ~59 warnings, 0 errors), `npm test` (5 files, 54 tests), `npm run build` (`tsc -b` then `vite build`).

# Deploy Sigflo on Netlify

**Production site:** [https://sigflo.group](https://sigflo.group) (custom domain on Netlify; apex — add `www` in Netlify DNS if you use it too).

## Subdomain Matrix (recommended)

Use separate Netlify sites per hostname so deploys stay isolated and predictable.

| Subdomain | Purpose | Repo | Netlify site | Key settings |
|----------|---------|------|--------------|--------------|
| `sigflo.group` | Marketing / landing | `sig-flo` | Landing site | CTA points to `https://app.sigflo.group/` |
| `app.sigflo.group` | Primary trading app | `Sigflo` | App site | `VITE_BASE` unset or `/`; functions enabled |
| `beta.sigflo.group` | Beta launch / experiments | `sigflo-beta-launch` | Beta site | Separate env vars from production app |

### Cross-system allowlists for all active hosts

- **Supabase Auth Redirect URLs:** add each active host, for example:
  - `https://sigflo.group/**`
  - `https://app.sigflo.group/**`
  - `https://beta.sigflo.group/**` (if beta uses auth)
- **Express backend CORS (`FRONTEND_ORIGIN`)**: include every frontend origin that calls backend APIs:
  - `https://app.sigflo.group`
  - `https://beta.sigflo.group` (if beta calls backend)
  - `https://sigflo.group` (only if landing calls backend)

## How to deploy (after the site exists)

**Normal workflow (recommended):**

1. Commit and push to the branch Netlify is set to build (usually **`main`**).
2. Netlify runs **`npm run build`** automatically and publishes **`dist`**.
3. Watch **Deploys** in the [Netlify dashboard](https://app.netlify.com) for that site; when it’s **Published**, **https://sigflo.group** updates.

**Trigger a deploy without a git push:** Dashboard → **Deploys** → **Trigger deploy** → **Deploy site**.

**CLI (optional):** Install [Netlify CLI](https://docs.netlify.com/cli/get-started/), run `netlify login`, then from the repo root:

```bash
netlify deploy --prod
```

(`--prod` publishes to production; omit it for a draft URL.)

---

## One-time setup

1. **Create a site** in [Netlify](https://app.netlify.com) → Add new site → Import an existing project → pick this Git repo.
2. **Build settings** (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
3. **Environment variables** (Site configuration → Environment variables). Add at least the ones your features need:

| Variable | Required for | Notes |
|----------|----------------|-------|
| `OPENAI_API_KEY` or `AI_API_KEY` | AI suggest, deep analysis, market news scan | Serverless functions only; never `VITE_*`. |
| `OPENAI_MODEL` | AI | Optional; default `gpt-4o-mini`. |
| `OPENAI_API_ENDPOINT` | AI | Optional; custom OpenAI-compatible URL. |
| `NEWS_RSS_FEEDS` | News scan | Optional; comma-separated RSS URLs or JSON array string. |

**Frontend** (`VITE_*` — exposed to the browser; set in Netlify UI the same way):

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Auth |
| `VITE_SUPABASE_ANON_KEY` | Auth |
| `VITE_AUTH_REDIRECT_ORIGIN` | Optional canonical origin for Google OAuth return (e.g. `https://www.sigflo.group`) if apex→www redirects broke sign-in; must match entries in Supabase **Redirect URLs**. |
| `VITE_BACKEND_API_BASE` | Exchange integrations API (e.g. `https://your-api.onrender.com/api`) if you host `backend/` elsewhere |
| `VITE_BASE` | Only if the app is served under a subpath (must end with `/`; see `vite.config.ts`) |

**Beta admin (in-app approvals)** — serverless only; never `VITE_*` except the existing Supabase URL/anon for JWT verification:

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase (Settings → API). Used by `POST /api/admin/beta` to update `public.profiles.approved`. |
| `SIGFLO_BETA_ADMIN_EMAILS` | Comma- or newline-separated emails allowed to call the admin API (must match signed-in user). |
| `SIGFLO_BETA_ADMIN_USER_IDS` | Optional comma-separated auth user UUIDs also allowed (if you prefer IDs over emails). |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Optional overrides for functions; if unset, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used. |

Redeploy after changing env vars.

### App at `app.sigflo.group`

The SPA treats **`app.sigflo.group`** as the product host: the **feed hub is `/`**, and **`/landing`** is the in-app marketing page if needed. Marketing on **www** stays **`/` = landing**, **`/feed` = product** when the build uses site root (`VITE_BASE` unset or `/`).

1. Add **`app.sigflo.group`** in Netlify → **Domain management** (same site or a dedicated deploy).
2. For that hostname, build with **`VITE_BASE` unset** or **`VITE_BASE=/`** (not `/feed/`), so assets load from `/assets/*` and routes match.
3. In **Supabase → Authentication → URL configuration**, add **`https://app.sigflo.group/**`** to redirect allowlists alongside www/apex.
4. Landing **“Open app”** links to **`https://app.sigflo.group/`** in production (`src/config/appRoutes.ts`).
5. On the **Express backend** (Railway, Render, etc.), add **`https://app.sigflo.group`** to **`FRONTEND_ORIGIN`** (comma-separated). CORS must allow that exact origin or **exchange connect** (`POST /api/integrations/bybit/connect`) fails in the browser—often first noticed on mobile when the app is opened on the subdomain.

Local dev: set **`VITE_APP_HOST=app`** in `.env.local` to mimic app routing on `localhost`.

## What Netlify serves

- **Static SPA** from `dist/` (Vite build).
- **Functions**: `POST /api/ai/suggest` → `ai-suggest`, `POST /api/ai/news-scan` → `market-news-scan`, `POST /api/admin/beta` → `admin-beta` (beta waitlist approvals).
- **SPA routing**: all other paths rewrite to `index.html` so React Router works.

## Optional checks

- Run `npm run build` locally before pushing; fix any TypeScript errors.
- Supabase → Authentication → URL configuration: add **`https://sigflo.group/**`** (and **`https://www.sigflo.group/**`** if you serve `www`). Keep `http://localhost:3999/**` for Netlify Dev.
- The Express app in `backend/` is **not** deployed by this Netlify config; host it separately and point `VITE_BACKEND_API_BASE` at it.

## Local parity

- `npm run dev` → Netlify Dev (port from `netlify.toml`, default **3999**): same redirects and functions as production.
- `npm run dev:vite` → Vite only on **5173**; AI routes are handled by Vite middleware instead of functions.

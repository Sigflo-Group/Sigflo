# Sigflo

> Learn Trading By Doing.

Sigflo is a trading workspace designed to help people learn the language of trading through practice, experimentation, and real-world experience.

The project is currently developed in a private repository while the product is being hardened. Our long-term direction is open development: transparent documentation, inspectable behavior, and a contribution model that can expand as the project matures.

Most trading platforms assume you already know what you're doing. Sigflo starts from a different belief: **trading is a skill that can be learned.**

Instead of overwhelming new traders with charts, indicators, and complexity, Sigflo provides an environment where users can explore markets, test ideas, understand risk, and develop their own approach over time. Whether you're placing your first paper trade or refining automated strategies, Sigflo is built to support the journey from curiosity to competence.

## Our Mission

To make trading education practical, transparent, and accessible.

We believe the best way to learn trading is not through expensive courses, influencers, or unrealistic promises. You learn by observing markets, experimenting safely, making mistakes, reviewing outcomes, and improving through repetition.

Sigflo exists to support that process.

## What Sigflo Provides

**Paper trading** — Practice without risking capital. Learn how markets move, test ideas, and build confidence before transitioning to live trading.

**Live trading** — Connect supported exchanges and manage real positions from a unified workspace.

**Trading bots** — Explore automated trading strategies and understand how algorithmic systems operate. Bots are not presented as shortcuts to success; they are tools for learning, experimentation, and disciplined execution.

**Performance analytics** — Review your results, identify strengths and weaknesses, and learn from both winning and losing trades.

**Transparent development** — Sigflo is being built with a strong bias toward inspectable behavior, clear documentation, and an eventual broader contribution model. The source repository is currently private during active product hardening.

## Why Transparency Matters

Trust matters. Financial software should not be a black box.

Sigflo is being designed so users and contributors can understand how the platform works, verify important behavior, and scrutinize the systems that handle trading logic and exchange connections. As the project matures, we intend to expand public access and contribution opportunities deliberately rather than overstate the repository's current visibility.

## Who Is Sigflo For?

- New traders seeking a safe place to learn
- Intermediate traders looking to improve
- Developers interested in trading systems
- Builders who believe financial education should be accessible
- Anyone curious about how markets work

## Our Philosophy

Learn first. Trade second.

The goal is not to create more traders. The goal is to create better traders — thoughtful traders, disciplined traders, traders who understand risk, and traders who understand *why* they are making decisions.

The market will always be uncertain. Learning should not be.

## Contributing

Sigflo is not yet accepting broad public contributions because the source repository is currently private. Internal and invited contributors can use [Contributing to Sigflo](CONTRIBUTING.md), [The Sigflo Manifesto](MANIFESTO.md), the [Roadmap](ROADMAP.md), and [Introducing Sigflo](FIRST_RELEASE.md).

Our intention is to widen participation as the project and contribution process mature.

---

## For developers

**Stack:** React 19, TypeScript, Vite, Tailwind · Node/Express backend · Bybit & MEXC integrations · Netlify frontend/serverless functions · Railway-compatible Express backend

| Task | Command |
| --- | --- |
| Frontend | `npm run dev` — Vite on `:5173` |
| Frontend (explicit Vite alias) | `npm run dev:vite` — Vite on `:5173` |
| Netlify local parity | `npm run dev:netlify-alt-port` — Netlify Dev on `:4000` |
| Backend API | `npm run dev:backend` — Express on `:8787` |
| Tests | `npm test` |
| Lint | `npm run lint` |
| Production build | `npm run build` |

**Deployment model**

- The frontend SPA and Netlify Functions are deployed on Netlify.
- The Express backend is deployed separately (Railway is supported and currently used by the connected deployment status; Render or another Node host can also work).
- `VITE_BACKEND_API_BASE` connects the frontend to the separately hosted Express API.

**Docs**

- [Dev quickstart](docs/DEV_QUICKSTART.md) — local setup, env vars, common issues
- [Netlify deploy](docs/NETLIFY.md) — frontend/serverless production env and checklist
- [Backend README](backend/README.md) — Postgres, migrations, exchange credentials, and backend hosting
- [Security policy](SECURITY.md) — reporting vulnerabilities responsibly
- [Disclaimer](DISCLAIMER.md) — educational use, risk, and liability

**Project layout**

- `src/` — frontend SPA (source of truth)
- `backend/` — Express API for live exchange trading and portfolio sync, deployed separately from Netlify
- `netlify/functions/` — serverless AI and admin routes deployed with the frontend

The signal engine runs client-side in the browser; the backend holds encrypted exchange keys and executes trades server-side when connected.

---

## Disclaimer

Sigflo is for educational and informational purposes only. It does not provide financial advice, investment recommendations, or guarantees of any kind. Trading involves substantial risk.

See the full [Disclaimer](DISCLAIMER.md).

# Sigflo

> Learn Trading By Doing.

Sigflo is an open-source trading workspace designed to help people learn the language of trading through practice, experimentation, and real-world experience.

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

**Open development** — Sigflo is developed in public. Our roadmap, discussions, and code are open for anyone to inspect, improve, and contribute to.

## Why Open Source?

Trust matters. Financial software should not be a black box.

By building Sigflo in the open, we allow users to understand how the platform works, verify its behavior, and contribute to its future. We believe transparency creates better software and stronger communities.

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

Sigflo is an open-source project and welcomes contributions of all kinds — bug fixes, documentation, design, testing, and new ideas. Your work helps make trading education more accessible.

See [Contributing to Sigflo](CONTRIBUTING.md), [The Sigflo Manifesto](MANIFESTO.md), the [Roadmap](ROADMAP.md), and [Introducing Sigflo](FIRST_RELEASE.md).

Together, we can build better tools for learning.

---

## For developers

**Stack:** React 19, TypeScript, Vite, Tailwind · Node/Express backend · Bybit & MEXC integrations · Netlify deploy

| Task | Command |
| --- | --- |
| Frontend (recommended) | `npm run dev` — Netlify Dev on `:3999` with AI routes |
| Frontend (UI only) | `npm run dev:vite` — Vite on `:5173` |
| Backend API | `npm run dev:backend` — Express on `:8787` |
| Tests | `npm test` |
| Production build | `npm run build` |

**Docs**

- [Dev quickstart](docs/DEV_QUICKSTART.md) — local setup, env vars, common issues
- [Netlify deploy](docs/NETLIFY.md) — production env and checklist
- [Backend README](backend/README.md) — Postgres, migrations, exchange credentials
- [Security policy](SECURITY.md) — reporting vulnerabilities responsibly
- [Disclaimer](DISCLAIMER.md) — educational use, risk, and liability

**Project layout**

- `src/` — frontend SPA (source of truth)
- `backend/` — optional Express API for live exchange trading and portfolio sync
- `netlify/functions/` — serverless AI and admin routes in production

The signal engine runs client-side in the browser; the backend holds encrypted exchange keys and executes trades server-side when connected.

---

## Disclaimer

Sigflo is for educational and informational purposes only. It does not provide financial advice, investment recommendations, or guarantees of any kind. Trading involves substantial risk.

See the full [Disclaimer](DISCLAIMER.md).

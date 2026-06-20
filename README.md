# World Cup Companion

A real-time fan companion app for the 2026 FIFA World Cup. Track live scores, submit match predictions, follow shot heatmaps, and chat with other fans — all in one mobile-first PWA.

**Live:** https://worldcup-companion-beta.vercel.app

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Auth & DB | Supabase (magic link auth, Postgres, Realtime, RLS) |
| Backend | Vercel serverless functions (ESM) |
| Live data | ESPN unofficial scoreboard API |
| Deploy | Vercel (SPA rewrite + daily cron) |

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon` key |

> Never commit `.env` — it's already in `.gitignore`.

### 3. Apply database migrations

Run all migrations in order via the Supabase SQL Editor, or use the migration script:

```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_KEY=eyJ... \
npm run migrate
```

### 4. Run the dev server

```bash
npm run dev
```

Opens at http://localhost:5173

---

## Testing

Tests are HTTP-level integration tests (Playwright, no browser). They require a live Supabase instance.

```bash
export SUPABASE_SERVICE_KEY=eyJ...
export TEST_USER_EMAIL=you@example.com
export BASE_URL=https://worldcup-companion-beta.vercel.app  # or http://localhost:5173

npm run test:phase8   # full live features suite (recommended)
npm run test:phase6   # schedule hub
npm run test:phase4   # onboarding flow
# etc — see package.json for all test:* scripts
```

Or use the helper script which validates env vars and saves output:

```bash
./scripts/run-tests.sh
```

---

## Deployment

Deployed automatically to Vercel on every push to `main`. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY` as environment variables in the Vercel project settings.

A daily cron at `0 5 * * *` UTC calls `/api/update-scores` to backfill match results.

---

## Docs

Full developer documentation is in [`docs/`](docs/):

- [`PROJECT_BLUEPRINT.md`](docs/PROJECT_BLUEPRINT.md) — architecture, user flows, state management
- [`SUPABASE_SCHEMA_AND_RLS.md`](docs/SUPABASE_SCHEMA_AND_RLS.md) — tables, RLS policies, triggers
- [`API_INTEGRATIONS.md`](docs/API_INTEGRATIONS.md) — serverless endpoints, ESPN API quirks
- [`COMPONENT_AND_HOOKS_REFERENCE.md`](docs/COMPONENT_AND_HOOKS_REFERENCE.md) — all components and hooks
- [`DEVELOPMENT_ROADMAP.md`](docs/DEVELOPMENT_ROADMAP.md) — feature backlog and priorities
- [`HANDOFF_NOTES_FOR_NEXT_AI.md`](docs/HANDOFF_NOTES_FOR_NEXT_AI.md) — orientation guide for AI assistants

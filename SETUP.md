# World Cup Companion — Phase 0 Setup

## Prerequisites

- **Node.js 20+** — install via [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm), or download from nodejs.org
- A free **Supabase** project — create one at [supabase.com](https://supabase.com)

---

## 1 — Install Node.js (if not already installed)

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc          # or ~/.bashrc
nvm install 20
nvm use 20
node --version           # should print v20.x.x
```

---

## 2 — Install project dependencies

```bash
cd worldcup-companion
npm install
```

---

## 3 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

| Variable                | Where to find it |
|-------------------------|-----------------|
| `VITE_SUPABASE_URL`     | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY`| Supabase Dashboard → Project Settings → API → `anon` `public` key |

> **Never commit `.env`** — it's already in `.gitignore`.

---

## 4 — Apply the database schema

1. Open **Supabase Dashboard → SQL Editor → New query**
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

This creates:
- `profiles` table — one row per user, auto-populated on sign-up
- `messages` table — fan chat messages with optional match scoping
- RLS policies — users can read all; only own rows are mutable
- Triggers — `updated_at` and auto-profile-creation on auth sign-up

---

## 5 — Configure Supabase Auth

In Supabase Dashboard → **Authentication → Providers**:

- Ensure **Email** is enabled
- Under **Email** settings → enable **"Enable Email OTP"** (6-digit code)
- Optionally disable "Confirm email" if you want magic-link-only flow

> The app defaults to OTP (6-digit code). To switch to magic links instead,  
> change `shouldCreateUser: true` in `AuthPage.tsx` → `handleSendOtp` and use  
> `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })`.

---

## 6 — Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 7 — Build for production

```bash
npm run build       # outputs to dist/
npm run preview     # serve the production build locally
```

### Deploy options (all free)

| Platform   | Command / Method |
|------------|-----------------|
| **Vercel** | `npx vercel` — add env vars in project settings |
| **Netlify**| Drag `dist/` into Netlify Drop, or `npx netlify deploy --prod` |
| **GitHub Pages** | Push `dist/` to `gh-pages` branch via `gh-pages` npm package |

> Remember to add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment  
> variables in whichever hosting platform you use.

---

## Project structure

```
worldcup-companion/
├── index.html                    # Entry HTML, mobile viewport meta
├── src/
│   ├── main.tsx                  # React root mount
│   ├── index.css                 # Tailwind directives + mobile base styles
│   ├── App.tsx                   # Router + protected routes
│   ├── lib/
│   │   ├── supabaseClient.ts     # Configured Supabase client (singleton)
│   │   └── database.types.ts     # TypeScript types matching DB schema
│   ├── providers/
│   │   └── SupabaseProvider.tsx  # Auth context + session listener
│   └── pages/
│       ├── AuthPage.tsx          # Email → OTP two-step login
│       └── HomePage.tsx          # Post-login placeholder
├── supabase/
│   └── schema.sql                # DB schema — run once in SQL Editor
├── tailwind.config.js
├── vite.config.ts
├── tsconfig*.json
├── .env.example
└── SETUP.md                      # This file
```

---

## Generating typed Supabase client (optional but recommended)

After applying the schema you can auto-generate `src/lib/database.types.ts`:

```bash
npx supabase login
npx supabase gen types typescript --project-id <your-project-ref> \
  > src/lib/database.types.ts
```

Find `<your-project-ref>` in your Supabase project URL:  
`https://app.supabase.com/project/<your-project-ref>`

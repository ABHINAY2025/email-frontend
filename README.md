# ApplyFlow — Frontend

React + TypeScript + Vite UI for **ApplyFlow**, a private job-application tracker powered by your own mailboxes.
The backend (Spring Boot + MongoDB, IMAP sync) lives in [email-backend](https://github.com/ABHINAY2025/email-backend).

Pages: overview dashboard, applications (table/list with filters), application detail (timeline, emails, notes,
audit history), job inbox with match review, calendar (month/week/day/agenda), Kanban (drag to change status),
companies, analytics, email accounts and settings. Light mode by default, dark mode supported. `Ctrl/⌘ + K` opens
the command palette.

Stack: React 18, TypeScript, Vite, React Router, Tailwind CSS, Radix/shadcn-style components, TanStack Query,
Recharts, date-fns, React Hook Form + Zod, cmdk, dnd-kit. Real-time updates via Server-Sent Events (`/api/events`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api → the deployed backend
npm run build    # type-check + production build into dist/
```

The app always calls `/api/...` on its own origin; something in front of it forwards that to the backend:

- **Dev (`npm run dev`)**: the Vite proxy forwards to `https://email-backend-0rid.onrender.com`. To use a local
  backend instead, create `frontend/.env.local` with `VITE_API_TARGET=http://localhost:8080`.
- **Production**: [render.yaml](render.yaml) deploys `dist/` as a Render static site and rewrites `/api/*` to the
  backend, so session and CSRF cookies stay first-party.

Log in with your email (or the backend's `APP_USERNAME` / `APP_PASSWORD` admin). The free Render backend sleeps when
idle, so the first request after a while can take ~30-60 s.

## Accounts & onboarding

- **Sign up** at `/register` (display name, email, password ≥ 8). The link on `/login` only appears when
  `GET /api/auth/config` reports `registrationEnabled: true`; if that endpoint is missing or fails, sign-up stays hidden.
- **Setup guide** at `/welcome`: a five-step guide (Google 2-Step Verification → App Password → connect mailbox →
  first sync with live progress → tour). New users land there right after sign-up, and users with unfinished
  onboarding are redirected there once per browser session when they open the dashboard. While setup is unfinished,
  the dashboard shows a "Getting started" checklist. You can reopen the guide anytime from the profile menu
  (**Setup guide**). Status comes from `GET /api/onboarding`. If that endpoint is unavailable, nothing is pushed at the
  user, and the guide works from the email-account and sync status instead.

The REST/SSE contract shared with the backend is in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

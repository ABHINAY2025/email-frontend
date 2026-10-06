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
npm run dev      # http://localhost:5173, proxies /api → http://localhost:8080 (the backend)
npm run build    # type-check + production build into dist/
```

Start the backend first (`./mvnw spring-boot:run` in the backend repo), then log in with the backend's
`APP_USERNAME` / `APP_PASSWORD`.

The REST/SSE contract shared with the backend is in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).

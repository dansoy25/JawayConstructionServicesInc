# Jaway Construction Services Inc. — Workforce Platform

> Powered by **TingSync**

Employee attendance + admin management PWA for **Jaway Construction Services Inc.**, built for the TingSync workforce platform.

**Two interfaces, one codebase:**
- **Employee mobile app** — PIN login, GPS-verified clock-in, attendance, schedule, leave, tasks, reports
- **Admin desktop web** — 13 sidebar-driven pages: Dashboard, Attendance, Employees, Tasks, Leave Management, Payroll, Payslips, Sales, Expenses, Inventory, Reports, Backup, Settings

## Stack

| Layer | Tech |
|-------|------|
| Build | Vite 6 |
| UI | React 18 + Tailwind CSS v4 |
| Routing | React Router 6 |
| Backend | Supabase (Auth, Postgres, RLS) |
| Auth model | Synthetic email `{employee_code}@{org_code}.tingsync.local` + password/PIN |
| GPS | Client-side haversine geofence |
| Deploy | Netlify (auto), works on Vercel/GitHub Pages too |

## Quick start

```bash
# 1. Install
npm install

# 2. Configure Supabase
cp .env.example .env.local
# Edit .env.local with your Supabase URL + anon key

# 3. Run
npm run dev
# Opens http://localhost:5177
```

## Test credentials (siteforce Supabase)

| Role | Company Code | Username | Password | URL |
|------|--------------|----------|----------|-----|
| Admin | JAWAY-0026 | admin | Admin@123 | `/login` |
| Employee | JAWAY-0026 | EMP-001 | 123456 | `/employee` |

## Routes

- `/login` — Admin desktop split-panel sign-in (Google/Microsoft SSO UI-only, Company Code + Username + Password)
- `/employee` — Employee mobile PIN keypad login (rotating clock, 6-digit PIN, keep-me-signed-in)
- `/` — Employee mobile shell (auto-redirects admins to `/admin/dashboard`)
- `/admin/*` — Admin sidebar shell (13 pages, blocked for non-admins)

Role is auto-detected from `profiles.is_admin`.

## Screens

**Employee mobile (18)**: Login, Home, ClockIn (GPS verify), Attendance, Schedule (14-day picker, swipeable), Leave, Overtime, Team, Reports (5 sub-screens), Profile, PersonalInfo, Security, Notifications.

**Admin desktop (13)**: Dashboard, Attendance, Employees, Tasks (Kanban), LeaveManagement (approve queue), Payroll, Payslips, Sales, Expenses, Inventory, Reports, Backup, Settings.

Both light + dark theme.

## Deploy to Netlify

The included `netlify.toml` sets the build command + SPA redirects. In Netlify:

1. Import from GitHub
2. Add these environment variables:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon key
3. Deploy — done.

## Supabase schema

Reuses the **siteforce** database (project ref `ykgbwziouggispmdabps`). Tables used:
`organizations`, `profiles`, `sites`, `attendance`, `leave_types`, `leave_requests`, `leave_balances`, `tasks`, `payslips`, `notifications`, `announcements`.

No new migrations required.

## License

Private / proprietary. All rights reserved.

---
Designed and Developed by TingSync.

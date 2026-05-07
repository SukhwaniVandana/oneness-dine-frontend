# ONENESS Dine — POS Frontend
**Part of ONENESS-ERP | Client: Diet Delight Restaurant, Kolhapur**

---

## Tech Stack
| Layer | Choice |
|-------|--------|
| UI Framework | React 18 |
| Routing | React Router v6 |
| Data Fetching | React Query v5 + Axios |
| Styling | CSS Modules + CSS Variables |
| Fonts | Rajdhani (headings) + DM Sans (body) |

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Make sure Spring Boot is running on :8080
#    (oneness-dine backend)

# 3. Start the dev server
npm start
# Opens at http://localhost:3000
```

---

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Spinner.jsx          # Inline action spinner (sm/md/lg, variants)
│   │   ├── Spinner.module.css
│   │   ├── Toast.jsx            # Toast notification system (success/error/warning/info)
│   │   ├── Toast.module.css
│   │   ├── SessionTimer.jsx     # Live ticking HH:MM:SS for occupied tables
│   │   └── ErrorHandler.jsx     # ErrorBoundary + mapApiError (all HTTP status codes)
│   │
│   ├── layout/
│   │   ├── AppLayout.jsx        # Sidebar + Topbar + theme toggle shell
│   │   └── AppLayout.module.css
│   │
│   └── tables/
│       ├── TableCard.jsx        # Individual table tile component
│       ├── TableCard.module.css
│       ├── TableSkeleton.jsx    # Shimmer skeleton for initial load
│       └── TableSkeleton.module.css
│
├── context/
│   └── ThemeContext.jsx         # Dark/Light mode toggle (persisted to localStorage)
│
├── hooks/
│   └── useTables.js             # React Query hooks: useTables, useTableSummary,
│                                #   useOpenSession, useUpdateTableStatus
├── pages/
│   └── TablesDashboard.jsx      # ✅ BUILT — Table grid, filters, skeleton, error states
│
├── services/
│   ├── apiClient.js             # Axios instance — JWT interceptor, 401 auto-logout
│   └── tableService.js          # All table API calls mapped to your endpoints
│
├── theme/
│   └── tokens.css               # All CSS variables — Dark + Light mode tokens
│
├── App.jsx                      # Root — QueryClient, Router, providers, ErrorBoundary
├── index.js                     # Entry point
└── index.css                    # Global styles, skeleton animation, badge/btn utilities
```

---

## Screens Status

| Screen | Status |
|--------|--------|
| Tables Dashboard | ✅ Built |
| Order Taking | 🚧 Next |
| KOT (Kitchen Display) | 🚧 Pending |
| Billing | 🚧 Pending |
| Reports Dashboard | 🚧 Pending |
| Admin Panel | 🚧 Pending |
| Login | 🚧 Pending |

---

## UX Principles (baked in everywhere)
1. **Loaders** — Skeleton on page load, inline spinner on actions, never blank screens
2. **Smoothness** — Optimistic updates via React Query, CSS transitions, auto-refresh every 30s
3. **Error handling** — Every HTTP status mapped to a friendly message via `mapApiError()`
   - Network down → "Cannot reach server"
   - 401 → Auto-redirect to login
   - 403 → "Access Denied"
   - 404 → "Record not found"
   - 422 → Field-level validation messages from Spring Boot `@Valid`
   - 500 → "Server Error, try again"

---

## Backend API Mapping (Tables)

| Hook | Method | Endpoint |
|------|--------|----------|
| `useTables` | GET | `/api/tables?branchId=1` |
| `useTableSummary` | GET | `/api/tables/summary?branchId=1` |
| `useOpenSession` | POST | `/api/tables/{id}/open-session` |
| `useUpdateTableStatus` | PUT | `/api/tables/{id}/status` |

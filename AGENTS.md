# SimpCommerce Admin Dashboard

Vue 3 + TypeScript + Vite SPA — e-commerce management dashboard for product/inventory/order management, CRM, invoicing, POS, and reports.

See `AGENTS.md` at the repo root for the full monorepo structure — this project is one of three (api backend, admin dashboard, clothing storefront).

## Agent

This project has a dedicated subagent and skill:

- **`@dashboard-engineer`** — invoke for admin work. Loads the `vue-dashboard` skill for detailed conventions.
- **`vue-dashboard` skill** — component patterns, axios client, Pinia stores, composables, i18n, Tailwind v4 theming, deployment modes.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 + TypeScript 6 |
| Build | Vite 8 |
| UI | Tailwind v4, class-variance-authority, lucide-vue-next |
| State | Pinia |
| i18n | vue-i18n (EN + MY) |
| HTTP | Axios |
| Charts | Chart.js + vue-chartjs |
| PM | Bun |

## Quick Commands

```bash
bun install
bun run dev                           # http://localhost:5173 (proxies /api to :8000)
bun run build                         # vue-tsc typecheck then vite build
```

## Deployment Modes

Controlled by `VITE_APP_MODE` and `VITE_STORE_SLUG` env vars:

| Mode | VITE_APP_MODE | VITE_STORE_SLUG | Deployments | Behavior |
|------|---------------|----------------|-------------|----------|
| System admin | `system` | unset | Single (one for all stores) | System pages (Users, Stores, Audit) visible |
| Per-store admin | `store` | clothing | One per storefront | Fixed X-Store, root users blocked, no system pages |

Vite proxies `/api` and `/storage` to `VITE_PROXY_TARGET` (defaults `http://localhost:8000`).

## Cross-Project

- **Depends on**: API (`api/`) — staff `Bearer` token auth, `X-Store` header, `{ data, meta }` paginated responses
- **Sibling**: Storefront (`storefront/clothing-storefront/`) — same API, different auth (customer session)
- **Types** in `src/types/index.ts` should mirror API resource shapes

## Verification

```bash
bun run build                         # typecheck + build
```

---
name: vue-dashboard
description: Vue 3 + TypeScript + Vite admin dashboard conventions — Pinia stores, axios API client, Shadcn-style UI components, Tailwind v4 theming, i18n, and router guards.
---

# Vue Dashboard Skill

Use when working in `admin/`. Vue 3 SPA for staff POS and management dashboard.

## Project Structure

```
src/
├── components/
│   ├── layout/          # AppSidebar, AppHeader, AppLayout
│   ├── ui/              # Shadcn-style (Button, Card, Input, Badge, Select)
│   └── *.vue            # Shared (PageHeader, Pagination, NotificationToast, ConfirmDialog, etc.)
├── composables/
│   ├── api/             # One per domain: useProductApi(), useCategoryApi(), etc.
│   ├── useListing.ts    # Generic paginated list composable
│   ├── useCrud.ts       # Extends useListing with form state + save/remove
│   ├── useNotify.ts     # Reactive toast singleton
│   └── useDebouncedWatch.ts
├── lib/                 # axios client, utils, i18n-errors, theme, notify
├── locales/             # en.json, my.json
├── pages/
│   ├── store/           # Store-level pages (POS, products, categories, sales, etc.)
│   ├── system/          # Root-only pages (stores, audit logs, backups)
│   └── shared/          # Shared pages (dashboard, users, profile)
├── router/              # store-routes.ts, system-routes.ts (VITE_APP_MODE selects which)
├── stores/              # Pinia: auth.ts, ui.ts
├── types/               # All TypeScript interfaces in index.ts
├── App.vue, main.ts, style.css
```

## API Client (`src/lib/axios.ts`)

```ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})
```

**Request interceptor** auto-attaches:
- `Authorization: Bearer <token>` from `useAuthStore().token`
- `X-Store: <slug>` from `useUIStore().activeStoreSlug`
- `Accept-Language: <locale>` from `localStorage.getItem('locale')`

**Response interceptor**: 401 → auto-logout + redirect `/login`; 503/504 → service unavailable toast.

## Component Conventions

- `<script setup lang="ts">` with Composition API
- UI components use `class-variance-authority` for variants + `cn()` (clsx + tailwind-merge) for class merging
- Each UI component has a `.vue` SFC and a `.ts` re-export barrel (e.g., `Button.vue` + `button.ts`)
- Pages import PageHeader, Pagination, LoadingSpinner, EmptyState, ConfirmDialog for standard layout
- Lucide icons imported individually from `lucide-vue-next`
- All Tailwind utility classes; no CSS modules

## Pinia Stores

- **auth.ts**: `token` (localStorage), `user`, `initialized`. Computed: `isRoot`, `isStoreOwner`, `canManageCatalog`, `canManageSales`. Actions: `login()`, `logout()`, `fetchUser()`.
- **ui.ts**: `theme`, `sidebarCollapsed`, `activeStoreSlug`. All persisted to localStorage via `watch()`. `activeStoreSlug` locked by `VITE_STORE_SLUG` env for single-store deploys.

## Composable Patterns

- `useListing<T>(endpoint)`: `items`, `meta`, `loading`, `loadPage(page)`. Uses `api.get()` with paginated response format.
- `useCrud<T>(endpoint, defaults)`: extends `useListing` with `form`, `showForm`, `editing`, `closeForm()`, `save()`, `remove(id)`.
- API composables (`composables/api/`): Factory functions returning method wrappers. E.g., `useProductApi()` → `{ list, get, create, update, remove, exportCsv, importCsv }`.

## Router

- `createWebHistory()` (no hash mode)
- `/login` — `{ guest: true }`, `/` — `{ auth: true }` wrapped in AppLayout
- `VITE_APP_MODE` determines `storeRoutes` vs `systemRoutes`
- All page components lazy-loaded via `() => import(...)`
- Navigation guard: hydrates user from token, redirects unauthenticated → `/login`, redirects authenticated away from `/login`

## Deployment Modes

| Env | Behavior |
|-----|----------|
| `VITE_STORE_SLUG` empty | Root dashboard: store selector, all stores, system pages visible |
| `VITE_STORE_SLUG=clothing` | Single-store: fixed X-Store, root users blocked, system pages hidden, no store selector |

## i18n

- `vue-i18n` v11 with `legacy: false` (Composition API mode)
- Two locales: `en.json`, `my.json` (Burmese)
- Locale persisted in `localStorage('locale')`, applied via `document.documentElement.lang`
- Translation errors mapped via `lib/i18n-errors.ts` (regex matches Laravel validation messages)

## Tailwind v4

- `@import "tailwindcss"` (v4 syntax, not `@tailwind base/components/utilities`)
- `@theme` block defines oklch color tokens (`--color-primary`, `--color-background`, `--color-foreground`, etc.)
- Dark mode via class-based `@custom-variant dark`; toggled by `lib/theme.ts`
- Six color themes via `data-theme` attribute (zinc, blue, violet, rose, orange, emerald)

## Build / Dev

```bash
bun install
bun run dev                           # http://localhost:5173 (proxies /api, /storage to :8000)
bun run build                         # vue-tsc typecheck then vite build
```

Vite proxies `/api` and `/storage` to `VITE_PROXY_TARGET` (defaults `http://localhost:8000`).

## Cross-Project Awareness

**Depends on**: API backend (`api/`) for all data. Auth via `Bearer` token (Sanctum `api` guard). Scoped by `X-Store` header.

**Sibling project**: Storefront (`storefront/clothing-storefront/`) shares the same API backend but uses customer session auth. Types should stay in sync with API resource responses. Admin types are in `src/types/index.ts`.

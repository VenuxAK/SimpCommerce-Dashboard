# SimpCommerce Frontend

Vue 3 + TypeScript + Vite SPA for SimpCommerce — a home-use Point of Sale system for clothing stores.

## Requirements

- Node.js 18+ / Bun
- Backend API running at `http://localhost:8000`

## Quick Start

```bash
# Install dependencies
bun install
# or: npm install

# Start development server
bun run dev
# → http://localhost:5173

# Build for production
bun run build
# → dist/
```

## Environment

Copy `.env.example` or set:

```env
VITE_API_URL=http://localhost:8000/api
```

The Vite dev server proxies `/api` and `/storage` to the Laravel backend automatically.

## Deployment

This single codebase serves two deployment modes controlled by the `VITE_STORE_SLUG` environment variable.

### Root Dashboard (multi-store)

Deploy with `VITE_STORE_SLUG` empty or unset. Root users can log in, see all stores,
use the store selector dropdown, and access system-level pages (Users, Stores, Audit Logs).

```bash
cd admin

# Root dashboard — no store slug
VITE_API_URL=https://api.example.com/api bun run build
# → dist/  (deploy to root-dashboard.example.com)
```

```bash
# Development
VITE_API_URL=http://localhost:8000/api bun run dev --port 3000
```

### Per-Store Dashboards (single-store)

Deploy with `VITE_STORE_SLUG` set to the store's slug. The store selector is hidden,
root users are blocked from logging in, and only store_admin/staff users can sign in.

```bash
cd admin

# Clothing store dashboard
VITE_API_URL=https://api.example.com/api VITE_STORE_SLUG=clothing bun run build
# → dist/  (deploy to clothing.example.com)

# Electronics store dashboard
VITE_API_URL=https://api.example.com/api VITE_STORE_SLUG=electronics bun run build
# → dist/  (deploy to electronics.example.com)
```

```bash
# Development — run multiple instances on different ports
VITE_API_URL=http://localhost:8000/api VITE_STORE_SLUG=clothing bun run dev --port 3001
VITE_API_URL=http://localhost:8000/api VITE_STORE_SLUG=electronics bun run dev --port 3002
```

### What the env var controls

| Behavior | Root (`VITE_STORE_SLUG` empty) | Per-Store (`VITE_STORE_SLUG=clothing`) |
|---|---|---|
| Store selector in header | ✅ Shown for root users | ❌ Hidden |
| Login restriction | None | Blocks root users |
| X-Store header sent to API | From store selector selection | Fixed to the deployment slug |
| System pages (Users, Stores, Audit) | ✅ Visible | ❌ Hidden |
| Default store scope | "All Stores" (unless a store is selected) | Fixed to the deployment store |

## Project Structure

```
src/
├── components/
│   ├── layout/          # AppSidebar, AppHeader, AppLayout
│   ├── ui/              # Shadcn-style components (Button, Card, Input, Badge, Select)
│   ├── NotificationToast.vue
│   └── Pagination.vue
├── lib/                 # Axios client, utils, i18n-errors, theme, notify
├── locales/             # en.json, my.json (English + Burmese)
├── pages/               # 18 page components
├── router/              # Vue Router with auth/admin guards
├── stores/              # Pinia (auth store)
├── types/               # TypeScript interfaces
├── App.vue
├── main.ts
└── style.css            # Tailwind v4 + dark mode variables
```

## Pages

| Route | Page | Description |
|---|---|---|
| `/login` | LoginPage | Auth with language toggle |
| `/` | DashboardPage | Summary cards, sales chart, backups |
| `/pos` | POSPage | Product grid, cart, barcode, discounts, checkout |
| `/products` | ProductListPage | Grid/list toggle, import/export CSV, pagination |
| `/products/new` | ProductFormPage | Create product with variants, images, cost |
| `/products/:id/edit` | ProductFormPage | Edit product |
| `/categories` | CategoryListPage | CRUD |
| `/suppliers` | SupplierListPage | CRUD with contact info |
| `/discounts` | DiscountListPage | CRUD with category/product targeting |
| `/customers` | CustomerListPage | Search, pagination |
| `/sales` | SalesListPage | Filters, pagination |
| `/sales/:id` | SaleDetailPage | Order detail + item-level return |
| `/invoices` | InvoiceListPage | Filters, pagination |
| `/invoices/:id` | InvoiceDetailPage | Print, receipt, PDF |
| `/reports` | ReportsPage | Sales, best sellers, payment methods |
| `/stock` | StockHistoryPage | Movement log |
| `/cash-sessions` | CashSessionsPage | Open/close register |
| `/users` | UsersPage | Admin: manage users |
| `/audit-logs` | AuditLogPage | Admin: activity log |
| `/profile` | ProfilePage | Update own info |

## Key Features

- **Barcode scanning** — auto-detects scanner input, looks up SKU, adds to cart
- **Dark mode** — toggle persisted in localStorage, system preference detection
- **i18n** — English + Burmese (မြန်မာ), validation errors translated
- **Responsive** — collapsible sidebar, mobile-friendly grids and tables
- **Toast notifications** — success/error/info with auto-dismiss
- **Pagination** — server-side pagination on all list pages
- **Product/variant images** — upload with live preview
- **Discounts** — percentage or fixed, applies to all/category/product
- **Sales chart** — Chart.js bar chart with 7d/30d/month toggle
- **Keyboard shortcuts** — `Ctrl+K` / `/` to focus POS search

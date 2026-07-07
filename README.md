# SimpCommerce Admin Dashboard

Vue 3 + TypeScript + Vite SPA — e-commerce management dashboard for the SimpCommerce platform.
Store admin use it to manage products, inventory, orders, customers, invoices, POS, and reports.

This single codebase serves two deployment modes:
- **`VITE_APP_MODE=system`** — root dashboard (one deployment, multi-store, for super admins)
- **`VITE_APP_MODE=store`** — per-store dashboard (one deployment per storefront, fixed to that store)

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
VITE_API_URL=http://localhost:8000/api/v1
```

The Vite dev server proxies `/api` and `/storage` to the Laravel backend automatically.

## Deployment

This single codebase serves two deployment modes controlled by `VITE_APP_MODE` (system|store).
`VITE_STORE_SLUG` further scopes the per-store instances.

### System Admin (`VITE_APP_MODE=system`, `VITE_STORE_SLUG` unset)

Deployed **once**. Root users log in, see all stores, and access system-level pages (Users, Stores, Audit Logs).

```bash
cd admin

VITE_API_URL=https://api.example.com/api/v1 VITE_APP_MODE=system bun run build
# → dist/system/  (deploy to admin.example.com)
```

```bash
# Development
VITE_APP_MODE=system bun run dev --port 3000
```

### Per-Store Dashboard (`VITE_APP_MODE=store`, `VITE_STORE_SLUG=<slug>`)

Deployed **once per storefront**, one admin per store. The store selector is hidden,
root users are blocked, and only store_admin/staff users for that store can sign in.

Each instance belongs to exactly one store — the same store served by its paired storefront.

```bash
cd admin

# Clothing store admin (paired with clothing storefront)
VITE_API_URL=https://api.example.com/api/v1 VITE_APP_MODE=store VITE_STORE_SLUG=clothing bun run build
# → dist/store/clothing/  (deploy to clothing-admin.example.com)

# Electronics store admin (paired with electronics storefront)
VITE_API_URL=https://api.example.com/api/v1 VITE_APP_MODE=store VITE_STORE_SLUG=electronics bun run build
# → dist/store/electronics/  (deploy to electronics-admin.example.com)
```

```bash
# Development — run multiple admin instances on different ports
VITE_APP_MODE=store VITE_STORE_SLUG=clothing bun run dev --port 3001
VITE_APP_MODE=store VITE_STORE_SLUG=electronics bun run dev --port 3002
```

### What the env vars control

| Behavior | System (`APP_MODE=system`) | Per-Store (`APP_MODE=store, SLUG=clothing`) |
|---|---|---|
| Deployments | Single (one admin for all stores) | One per storefront |
| Login restriction | None | Blocks root users |
| X-Store header sent to API | Scoped to store from user context | Fixed to the deployment slug |
| System pages (Users, Stores, Audit) | ✅ Visible | ❌ Hidden |

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

### E-Commerce Management
- **Product catalog** — full CRUD with variants, images, categories, brands, suppliers, import/export CSV
- **Inventory** — stock movement history, per-variant tracking
- **Orders** — sales list with filters, order detail with item-level returns
- **Invoicing** — invoices with search, filters, PDF generation, print, receipt
- **Customers** — CRM with search and pagination
- **Discounts** — percentage or fixed, applies to all/category/product
- **Suppliers** — contact management
- **Reports** — sales overview, best sellers, payment methods, Chart.js bar chart (7d/30d/month)
- **Multi-store** — switch stores via dropdown (root), or deploy per-store with fixed scope
- **User management** — staff roles (root, store_admin, staff) with admin-only pages

### Point of Sale
- **POS** — product grid, barcode scanning, cart, inline discounts, checkout
- **Barcode scanning** — auto-detects scanner input, looks up SKU, adds to cart
- **Cash sessions** — open/close register tracking

### System & Platform
- **RBAC** — role-based sidebar visibility and route guards
- **Dark mode** — toggle persisted in localStorage, system preference detection
- **i18n** — English + Burmese (မြန်မာ), validation errors translated
- **Responsive** — collapsible sidebar, mobile-friendly grids and tables
- **Toast notifications** — success/error/info with auto-dismiss
- **Pagination** — server-side pagination on all list pages
- **Keyboard shortcuts** — `Ctrl+K` / `/` to focus POS search

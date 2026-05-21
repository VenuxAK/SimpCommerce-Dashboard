# SimpPOS Frontend

Vue 3 + TypeScript + Vite SPA for SimpPOS — a home-use Point of Sale system for clothing stores.

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

import type { RouteRecordRaw } from 'vue-router'

export const storeRoutes: RouteRecordRaw[] = [
  { path: '', name: 'dashboard', component: () => import('../pages/shared/DashboardPage.vue') },
  { path: 'pos', name: 'pos', component: () => import('../pages/store/POSPage.vue') },
  { path: 'products', name: 'products', component: () => import('../pages/store/ProductListPage.vue') },
  { path: 'products/new', name: 'product-create', component: () => import('../pages/store/ProductFormPage.vue') },
  { path: 'products/:id/edit', name: 'product-edit', component: () => import('../pages/store/ProductFormPage.vue') },
  { path: 'categories', name: 'categories', component: () => import('../pages/store/CategoryListPage.vue') },
  { path: 'brands', name: 'brands', component: () => import('../pages/store/BrandListPage.vue') },
  { path: 'customers', name: 'customers', component: () => import('../pages/store/CustomerListPage.vue') },
  { path: 'customers/:id', name: 'customer-detail', component: () => import('../pages/store/CustomerDetailPage.vue') },
  { path: 'sales', name: 'sales', component: () => import('../pages/store/SalesListPage.vue') },
  { path: 'sales/:id', name: 'sale-detail', component: () => import('../pages/store/SaleDetailPage.vue') },
  { path: 'invoices', name: 'invoices', component: () => import('../pages/store/InvoiceListPage.vue') },
  { path: 'invoices/:id', name: 'invoice-detail', component: () => import('../pages/store/InvoiceDetailPage.vue') },
  { path: 'reports', name: 'reports', component: () => import('../pages/store/ReportsPage.vue') },
  { path: 'discounts', name: 'discounts', component: () => import('../pages/store/DiscountListPage.vue') },
  { path: 'suppliers', name: 'suppliers', component: () => import('../pages/store/SupplierListPage.vue') },
  { path: 'cash-sessions', name: 'cash-sessions', component: () => import('../pages/store/CashSessionsPage.vue') },
  { path: 'stock', name: 'stock', component: () => import('../pages/store/StockHistoryPage.vue') },
  { path: 'users', name: 'users', component: () => import('../pages/shared/UsersPage.vue') },
  { path: 'profile', name: 'profile', component: () => import('../pages/shared/ProfilePage.vue') },
]

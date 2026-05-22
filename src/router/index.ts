import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('../components/layout/AppLayout.vue'),
      meta: { auth: true },
      children: [
        { path: '', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
        { path: 'pos', name: 'pos', component: () => import('../pages/POSPage.vue') },
        { path: 'products', name: 'products', component: () => import('../pages/ProductListPage.vue') },
        { path: 'products/new', name: 'product-create', component: () => import('../pages/ProductFormPage.vue') },
        { path: 'products/:id/edit', name: 'product-edit', component: () => import('../pages/ProductFormPage.vue') },
        { path: 'categories', name: 'categories', component: () => import('../pages/CategoryListPage.vue') },
        { path: 'customers', name: 'customers', component: () => import('../pages/CustomerListPage.vue') },
        { path: 'customers/:id', name: 'customer-detail', component: () => import('../pages/CustomerDetailPage.vue') },
        { path: 'sales', name: 'sales', component: () => import('../pages/SalesListPage.vue') },
        { path: 'sales/:id', name: 'sale-detail', component: () => import('../pages/SaleDetailPage.vue') },
        { path: 'invoices', name: 'invoices', component: () => import('../pages/InvoiceListPage.vue') },
        { path: 'invoices/:id', name: 'invoice-detail', component: () => import('../pages/InvoiceDetailPage.vue') },
        { path: 'reports', name: 'reports', component: () => import('../pages/ReportsPage.vue') },
        { path: 'discounts', name: 'discounts', component: () => import('../pages/DiscountListPage.vue') },
        { path: 'suppliers', name: 'suppliers', component: () => import('../pages/SupplierListPage.vue') },
        { path: 'cash-sessions', name: 'cash-sessions', component: () => import('../pages/CashSessionsPage.vue') },
        { path: 'audit-logs', name: 'audit-logs', component: () => import('../pages/AuditLogPage.vue'), meta: { admin: true } },
        { path: 'stock', name: 'stock', component: () => import('../pages/StockHistoryPage.vue') },
        { path: 'users', name: 'users', component: () => import('../pages/UsersPage.vue'), meta: { admin: true } },
        { path: 'profile', name: 'profile', component: () => import('../pages/ProfilePage.vue') },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.initialized && auth.isAuthenticated) {
    await auth.fetchUser()
  }
  if (to.meta.auth && !auth.isAuthenticated) {
    return '/login'
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return '/'
  }
  if (to.meta.admin && !auth.isAdmin) {
    return '/'
  }
})

export default router

import type { RouteRecordRaw } from "vue-router";

export const storeRoutes: RouteRecordRaw[] = [
  {
    path: "",
    name: "dashboard",
    component: () => import("../pages/shared/DashboardPage.vue"),
  },
  {
    path: "pos",
    name: "pos",
    component: () => import("../pages/store/POSPage.vue"),
    meta: { roles: ["store_owner", "store_manager", "sales_staff"] },
  },
  {
    path: "products",
    name: "products",
    component: () => import("../pages/store/ProductListPage.vue"),
  },
  {
    path: "products/new",
    name: "product-create",
    component: () => import("../pages/store/ProductFormPage.vue"),
    meta: { roles: ["store_owner", "store_manager", "inventory_staff"] },
  },
  {
    path: "products/:id/edit",
    name: "product-edit",
    component: () => import("../pages/store/ProductFormPage.vue"),
    meta: { roles: ["store_owner", "store_manager", "inventory_staff"] },
  },
  {
    path: "categories",
    name: "categories",
    component: () => import("../pages/store/CategoryListPage.vue"),
    meta: { roles: ["store_owner", "store_manager", "inventory_staff"] },
  },
  {
    path: "brands",
    name: "brands",
    component: () => import("../pages/store/BrandListPage.vue"),
    meta: { roles: ["store_owner", "store_manager", "inventory_staff"] },
  },
  {
    path: "customers",
    name: "customers",
    component: () => import("../pages/store/CustomerListPage.vue"),
  },
  {
    path: "customers/:id",
    name: "customer-detail",
    component: () => import("../pages/store/CustomerDetailPage.vue"),
  },
  {
    path: "sales",
    name: "sales",
    component: () => import("../pages/store/SalesListPage.vue"),
    meta: { roles: ["store_owner", "store_manager"] },
  },
  {
    path: "sales/:id",
    name: "sale-detail",
    component: () => import("../pages/store/SaleDetailPage.vue"),
    meta: { roles: ["store_owner", "store_manager"] },
  },
  {
    path: "notifications",
    name: "notifications",
    component: () => import("../pages/store/NotificationsPage.vue"),
  },
  {
    path: "invoices",
    name: "invoices",
    component: () => import("../pages/store/InvoiceListPage.vue"),
    meta: { roles: ["store_owner", "store_manager"] },
  },
  {
    path: "invoices/:id",
    name: "invoice-detail",
    component: () => import("../pages/store/InvoiceDetailPage.vue"),
    meta: { roles: ["store_owner", "store_manager"] },
  },
  {
    path: "reports",
    name: "reports",
    component: () => import("../pages/store/ReportsPage.vue"),
    meta: { roles: ["store_owner", "store_manager"] },
  },
  {
    path: "discounts",
    name: "discounts",
    component: () => import("../pages/store/DiscountListPage.vue"),
    meta: { roles: ["store_owner", "store_manager"] },
  },
  {
    path: "suppliers",
    name: "suppliers",
    component: () => import("../pages/store/SupplierListPage.vue"),
    meta: { roles: ["store_owner", "store_manager", "inventory_staff"] },
  },
  {
    path: "cash-sessions",
    name: "cash-sessions",
    component: () => import("../pages/store/CashSessionsPage.vue"),
    meta: { roles: ["store_owner", "store_manager", "sales_staff"] },
  },
  {
    path: "stock",
    name: "stock",
    component: () => import("../pages/store/StockHistoryPage.vue"),
    meta: { roles: ["store_owner", "store_manager", "inventory_staff"] },
  },
  {
    path: "users",
    name: "users",
    component: () => import("../pages/shared/UsersPage.vue"),
    meta: { roles: ["store_owner"] },
  },
  {
    path: "audit-logs",
    name: "audit-logs",
    component: () => import("../pages/store/AuditLogPage.vue"),
    meta: { roles: ["store_owner", "store_manager"] },
  },
  {
    path: "profile",
    name: "profile",
    component: () => import("../pages/shared/ProfilePage.vue"),
  },
];

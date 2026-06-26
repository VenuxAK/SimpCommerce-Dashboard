import type { RouteRecordRaw } from 'vue-router'

export const systemRoutes: RouteRecordRaw[] = [
  { path: '', name: 'dashboard', component: () => import('../pages/shared/DashboardPage.vue') },
  { path: 'stores', name: 'stores', component: () => import('../pages/system/StoresPage.vue') },
  { path: 'audit-logs', name: 'audit-logs', component: () => import('../pages/system/AuditLogPage.vue') },
  { path: 'backups', name: 'backups', component: () => import('../pages/system/BackupPage.vue') },
  { path: 'users', name: 'users', component: () => import('../pages/shared/UsersPage.vue') },
  { path: 'profile', name: 'profile', component: () => import('../pages/shared/ProfilePage.vue') },
]

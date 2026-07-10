import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { storeRoutes } from './store-routes'

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
      path: '/403',
      name: 'forbidden',
      component: () => import('../pages/shared/ForbiddenPage.vue'),
      meta: { auth: true },
    },
    {
      path: '/store/:storeSlug',
      component: () => import('../components/layout/AppLayout.vue'),
      meta: { auth: true },
      children: storeRoutes,
    },
    {
      path: '/',
      name: 'home',
      component: { render: () => null },
      meta: { auth: true },
    },
    {
      // Catch-all route to redirect unrecognized paths
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const ui = useUIStore()

  // Sync store context immediately with route parameter
  if (to.params.storeSlug) {
    ui.setStore(to.params.storeSlug as string)
  } else {
    ui.setStore('')
  }

  // 1. Initialize auth state on first load
  if (!auth.initialized && auth.isAuthenticated && !to.meta.guest) {
    await auth.fetchUser()
  }

  // 2. Auth protection
  if (to.meta.auth && !auth.isAuthenticated) {
    return '/login'
  }

  // 3. Guest (login page) redirection
  if (to.meta.guest && auth.isAuthenticated) {
    if (auth.user?.store?.slug) {
      return `/store/${auth.user.store.slug}`
    }
    auth.logout()
    return '/login'
  }

  // 4. Store route parameter validation
  if (to.params.storeSlug) {
    // Block root users from logging into the store admin dashboard
    if (auth.isRoot) {
      auth.logout()
      return '/login'
    }
    // Block access if slug in URL does not match user's assigned store slug
    if (to.params.storeSlug !== auth.user?.store?.slug) {
      return '/403'
    }

    // Role-based access control (RBAC) guard
    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const hasPermission = to.meta.roles.some((role) => auth.hasRole(role as any))
      if (!hasPermission) {
        return '/403'
      }
    }
  }

  // 5. Root path redirection
  if (to.path === '/') {
    if (auth.user?.store?.slug) {
      return `/store/${auth.user.store.slug}`
    }
    auth.logout()
    return '/login'
  }
})

export default router

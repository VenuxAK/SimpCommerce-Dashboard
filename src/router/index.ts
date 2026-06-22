import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { systemRoutes } from './system-routes'
import { storeRoutes } from './store-routes'

const appMode = import.meta.env.VITE_APP_MODE || 'store'

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
      children: appMode === 'system' ? systemRoutes : storeRoutes,
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized && auth.isAuthenticated && !to.meta.guest) {
    await auth.fetchUser()
  }

  if (to.meta.auth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return '/'
  }
})

export default router

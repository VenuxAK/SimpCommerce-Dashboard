<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Users,
  Receipt,
  FileText,
  BarChart3,
  LogOut,
  X,
  Shield,
  UserCog,
  Percent,
  ClipboardList,
  RotateCcw,
  Truck,
  Wallet,
  History,
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import api from '../../lib/axios'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/pos', icon: ShoppingCart, label: 'nav.pos' },
  { to: '/products', icon: Package, label: 'nav.products' },
  { to: '/categories', icon: Tags, label: 'nav.categories' },
  { to: '/customers', icon: Users, label: 'nav.customers' },
  { to: '/sales', icon: Receipt, label: 'nav.sales' },
  { to: '/invoices', icon: FileText, label: 'nav.invoices' },
  { to: '/reports', icon: BarChart3, label: 'nav.reports' },
  { to: '/suppliers', icon: Truck, label: 'nav.suppliers' },
  { to: '/discounts', icon: Percent, label: 'nav.discounts' },
  { to: '/stock', icon: ClipboardList, label: 'nav.stock' },
  { to: '/cash-sessions', icon: Wallet, label: 'nav.cash' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  try { await api.post('/auth/logout') } catch {}
  auth.logout()
  router.push('/login')
}

function navigate(to: string) {
  router.push(to)
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-40 bg-black/50 lg:hidden" @click="emit('close')" />

  <aside
    :class="[
      'fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r bg-white dark:bg-zinc-950 dark:border-zinc-800 transition-transform duration-200',
      open ? 'translate-x-0' : '-translate-x-full',
      'lg:translate-x-0 lg:z-40',
    ]"
  >
    <div class="flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6">
      <span class="font-bold text-lg text-zinc-900 dark:text-zinc-100">{{ t('app') }}</span>
      <button @click="emit('close')" class="lg:hidden text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
        <X class="size-5" />
      </button>
    </div>

    <nav class="flex-1 space-y-1 p-3 overflow-y-auto">
      <button
        v-for="item in navItems"
        :key="item.to"
        @click="navigate(item.to)"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left"
        :class="isActive(item.to)
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'"
      >
        <component :is="item.icon" class="size-4 shrink-0" />
        <span class="truncate">{{ t(item.label) }}</span>
      </button>

      <div class="border-t border-zinc-200 dark:border-zinc-800 my-2" />

      <button
        v-if="auth.isAdmin"
        @click="navigate('/audit-logs')"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left"
        :class="isActive('/audit-logs')
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'"
      >
        <History class="size-4 shrink-0" />
        <span class="truncate">Audit</span>
      </button>
      <button
        v-if="auth.isAdmin"
        @click="navigate('/users')"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left"
        :class="isActive('/users')
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'"
      >
        <Shield class="size-4 shrink-0" />
        <span class="truncate">{{ t('nav.users') }}</span>
      </button>

      <button
        @click="navigate('/profile')"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left"
        :class="isActive('/profile')
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'"
      >
        <UserCog class="size-4 shrink-0" />
        <span class="truncate">{{ t('nav.profile') }}</span>
      </button>
    </nav>

    <div class="border-t border-zinc-200 dark:border-zinc-800 p-3">
      <button
        @click="handleLogout"
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 dark:text-zinc-400 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <LogOut class="size-4 shrink-0" />
        {{ t('auth.logout') }}
      </button>
    </div>
  </aside>
</template>

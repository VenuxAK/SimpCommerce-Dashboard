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
      'fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r bg-card transition-transform duration-300 ease-in-out',
      open ? 'translate-x-0' : '-translate-x-full',
      'lg:translate-x-0 lg:z-40',
    ]"
  >
    <div class="flex h-14 items-center justify-between border-b px-6">
      <div class="flex items-center gap-2">
        <div class="size-6 rounded bg-primary flex items-center justify-center">
          <Package class="size-4 text-primary-foreground" />
        </div>
        <span class="font-bold text-base tracking-tight text-foreground">{{ t('app') }}</span>
      </div>
      <button @click="emit('close')" class="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
        <X class="size-5" />
      </button>
    </div>

    <nav class="flex-1 space-y-0.5 p-3 overflow-y-auto custom-scrollbar">
      <button
        v-for="item in navItems"
        :key="item.to"
        @click="navigate(item.to)"
        class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group"
        :class="isActive(item.to)
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
      >
        <component :is="item.icon" :class="['size-4 shrink-0 transition-transform group-hover:scale-110', isActive(item.to) ? '' : 'opacity-70 group-hover:opacity-100']" />
        <span class="truncate">{{ t(item.label) }}</span>
      </button>

      <div class="h-px bg-border my-3 mx-2" />

      <div class="space-y-0.5">
        <button
          v-if="auth.isAdmin"
          @click="navigate('/audit-logs')"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group"
          :class="isActive('/audit-logs')
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
        >
          <History :class="['size-4 shrink-0 transition-transform group-hover:scale-110', isActive('/audit-logs') ? '' : 'opacity-70 group-hover:opacity-100']" />
          <span class="truncate">Audit</span>
        </button>
        <button
          v-if="auth.isAdmin"
          @click="navigate('/users')"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group"
          :class="isActive('/users')
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
        >
          <Shield :class="['size-4 shrink-0 transition-transform group-hover:scale-110', isActive('/users') ? '' : 'opacity-70 group-hover:opacity-100']" />
          <span class="truncate">{{ t('nav.users') }}</span>
        </button>

        <button
          @click="navigate('/profile')"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group"
          :class="isActive('/profile')
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'"
        >
          <UserCog :class="['size-4 shrink-0 transition-transform group-hover:scale-110', isActive('/profile') ? '' : 'opacity-70 group-hover:opacity-100']" />
          <span class="truncate">{{ t('nav.profile') }}</span>
        </button>
      </div>
    </nav>

    <div class="border-t p-3">
      <button
        @click="handleLogout"
        class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive group"
      >
        <LogOut class="size-4 shrink-0 transition-transform group-hover:-translate-x-1" />
        <span class="truncate">{{ t('auth.logout') }}</span>
      </button>
    </div>
  </aside>
</template>

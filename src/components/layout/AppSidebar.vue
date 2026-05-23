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
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'
import { useRouter } from 'vue-router'
import api from '../../lib/axios'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUIStore()

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
      'fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out',
      open ? 'translate-x-0' : '-translate-x-full',
      ui.sidebarCollapsed ? 'w-20' : 'w-56',
      'lg:translate-x-0 lg:z-40',
    ]"
  >
    <div :class="['relative flex h-14 items-center border-b transition-all duration-300', ui.sidebarCollapsed ? 'px-0 justify-center' : 'px-6 justify-between']">
      <div class="flex items-center gap-2 overflow-hidden">
        <div class="size-6 rounded bg-primary flex items-center justify-center shrink-0">
          <Package class="size-4 text-primary-foreground" />
        </div>
        <span v-if="!ui.sidebarCollapsed" class="font-bold text-base tracking-tight text-foreground whitespace-nowrap animate-in fade-in duration-500">{{ t('app') }}</span>
      </div>
      
      <button 
        @click="ui.toggleSidebar" 
        :class="[
          'hidden lg:flex items-center justify-center transition-all duration-300',
          ui.sidebarCollapsed 
            ? 'absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full border bg-card shadow-sm z-50 hover:bg-secondary text-muted-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <component :is="ui.sidebarCollapsed ? ChevronRight : ChevronLeft" class="size-4" />
      </button>

      <button @click="emit('close')" class="lg:hidden text-muted-foreground hover:text-foreground transition-colors">
        <X class="size-5" />
      </button>
    </div>

    <nav class="flex-1 space-y-0.5 p-3 overflow-y-auto custom-scrollbar">
      <button
        v-for="item in navItems"
        :key="item.to"
        @click="navigate(item.to)"
        class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all group w-full"
        :class="[
          isActive(item.to)
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          ui.sidebarCollapsed ? 'justify-center' : 'gap-3'
        ]"
        :title="ui.sidebarCollapsed ? t(item.label) : ''"
      >
        <component :is="item.icon" :class="['size-4 shrink-0 transition-transform group-hover:scale-110', isActive(item.to) ? '' : 'opacity-70 group-hover:opacity-100']" />
        <span v-if="!ui.sidebarCollapsed" class="truncate animate-in fade-in slide-in-from-left-2 duration-300">{{ t(item.label) }}</span>
      </button>

      <div class="h-px bg-border my-3 mx-2" />

      <div class="space-y-0.5">
        <button
          v-if="auth.isAdmin"
          @click="navigate('/audit-logs')"
          class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all group w-full"
          :class="[
            isActive('/audit-logs')
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            ui.sidebarCollapsed ? 'justify-center' : 'gap-3'
          ]"
          :title="ui.sidebarCollapsed ? 'Audit' : ''"
        >
          <History :class="['size-4 shrink-0 transition-transform group-hover:scale-110', isActive('/audit-logs') ? '' : 'opacity-70 group-hover:opacity-100']" />
          <span v-if="!ui.sidebarCollapsed" class="truncate animate-in fade-in slide-in-from-left-2 duration-300">Audit</span>
        </button>
        <button
          v-if="auth.isAdmin"
          @click="navigate('/users')"
          class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all group w-full"
          :class="[
            isActive('/users')
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            ui.sidebarCollapsed ? 'justify-center' : 'gap-3'
          ]"
          :title="ui.sidebarCollapsed ? t('nav.users') : ''"
        >
          <Shield :class="['size-4 shrink-0 transition-transform group-hover:scale-110', isActive('/users') ? '' : 'opacity-70 group-hover:opacity-100']" />
          <span v-if="!ui.sidebarCollapsed" class="truncate animate-in fade-in slide-in-from-left-2 duration-300">{{ t('nav.users') }}</span>
        </button>

        <button
          @click="navigate('/profile')"
          class="flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all group w-full"
          :class="[
            isActive('/profile')
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            ui.sidebarCollapsed ? 'justify-center' : 'gap-3'
          ]"
          :title="ui.sidebarCollapsed ? t('nav.profile') : ''"
        >
          <UserCog :class="['size-4 shrink-0 transition-transform group-hover:scale-110', isActive('/profile') ? '' : 'opacity-70 group-hover:opacity-100']" />
          <span v-if="!ui.sidebarCollapsed" class="truncate animate-in fade-in slide-in-from-left-2 duration-300">{{ t('nav.profile') }}</span>
        </button>
      </div>
    </nav>

    <div class="border-t p-3">
      <button
        @click="handleLogout"
        class="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive group w-full"
        :class="ui.sidebarCollapsed ? 'justify-center' : 'gap-3'"
        :title="ui.sidebarCollapsed ? t('auth.logout') : ''"
      >
        <LogOut class="size-4 shrink-0 transition-transform group-hover:-translate-x-1" />
        <span v-if="!ui.sidebarCollapsed" class="truncate animate-in fade-in slide-in-from-left-2 duration-300">{{ t('auth.logout') }}</span>
      </button>
    </div>
  </aside>
</template>

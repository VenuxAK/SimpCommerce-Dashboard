<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard, ShoppingCart, Package, Tags, Star, Users, Receipt,
  FileText, BarChart3, LogOut, X, Shield, UserCog, Percent,
  ClipboardList, Truck, Wallet, ChevronLeft, ChevronRight,
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'
import api from '../../lib/axios'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUIStore()

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

type NavItem = {
  to: string
  icon: any
  label: string
  roles?: string[]
  external?: boolean
}

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: '',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'nav.dashboard', roles: ['store_owner', 'store_manager'] },
      { to: '/', icon: LayoutDashboard, label: 'nav.home', roles: ['sales_staff', 'inventory_staff'] },
      { to: '/pos', icon: ShoppingCart, label: 'nav.pos', roles: ['store_owner', 'store_manager', 'sales_staff'] },
    ],
  },
  {
    label: 'nav.management',
    items: [
      { to: '/products', icon: Package, label: 'nav.products' },       // all store roles
      { to: '/categories', icon: Tags, label: 'nav.categories', roles: ['store_owner', 'store_manager', 'inventory_staff'] },
      { to: '/brands', icon: Star, label: 'brands.title', roles: ['store_owner', 'store_manager', 'inventory_staff'] },
      { to: '/customers', icon: Users, label: 'nav.customers' },        // all store roles
      { to: '/sales', icon: Receipt, label: 'nav.sales', roles: ['store_owner', 'store_manager'] },
      { to: '/invoices', icon: FileText, label: 'nav.invoices', roles: ['store_owner', 'store_manager'] },
      { to: '/reports', icon: BarChart3, label: 'nav.reports', roles: ['store_owner', 'store_manager'] },
      { to: '/suppliers', icon: Truck, label: 'nav.suppliers', roles: ['store_owner', 'store_manager', 'inventory_staff'] },
      { to: '/discounts', icon: Percent, label: 'nav.discounts', roles: ['store_owner', 'store_manager'] },
      { to: '/stock', icon: ClipboardList, label: 'nav.stock', roles: ['store_owner', 'store_manager', 'inventory_staff'] },
      { to: '/cash-sessions', icon: Wallet, label: 'nav.cash', roles: ['store_owner', 'store_manager', 'sales_staff'] },
    ],
  },
  {
    label: 'nav.system',
    items: [
      { to: '/users', icon: Shield, label: 'nav.users', roles: ['store_owner'] },
      { to: '/profile', icon: UserCog, label: 'nav.profile' },          // all
    ],
  },
]

function isItemVisible(item: NavItem): boolean {
  if (!item.roles) return true
  return item.roles.some(r => auth.role === r)
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  try { await api.post('/auth/logout') } catch {}
  auth.logout()
  router.push('/login')
}

function navigate(item: NavItem) {
  if (item.external) {
    window.open(item.to, '_blank')
  } else {
    router.push(item.to)
  }
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden" @click="emit('close')" />
  <aside
    :class="[
      'fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-sidebar transition-all duration-300 ease-in-out',
      open ? 'translate-x-0' : '-translate-x-full',
      ui.sidebarCollapsed ? 'w-16' : 'w-60',
      'lg:translate-x-0 lg:z-40',
    ]"
  >
    <div class="flex h-14 items-center px-4 border-b border-border/50">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <div :class="['size-7 rounded-md bg-foreground flex items-center justify-center shrink-0', ui.sidebarCollapsed ? 'mx-auto' : '']">
          <span class="text-[11px] font-bold text-background">S</span>
        </div>
        <span v-if="!ui.sidebarCollapsed" class="font-semibold text-sm tracking-tight text-sidebar-foreground truncate">{{ t('app') }}</span>
      </div>
      <button v-if="!ui.sidebarCollapsed" @click="ui.toggleSidebar" class="ml-auto hidden lg:flex items-center justify-center size-6 rounded-md hover:bg-sidebar-accent text-sidebar-muted transition-colors">
        <ChevronLeft class="size-3.5" />
      </button>
      <button @click="emit('close')" class="lg:hidden ml-auto text-sidebar-muted hover:text-sidebar-foreground transition-colors">
        <X class="size-5" />
      </button>
    </div>
    <div v-if="ui.sidebarCollapsed" class="justify-center py-3 border-b border-border/50 lg:flex hidden">
      <button @click="ui.toggleSidebar" class="size-7 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-sidebar-muted transition-colors">
        <ChevronRight class="size-3.5" />
      </button>
    </div>
    <nav class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-5">
      <div v-for="group in navGroups" :key="group.label">
        <p v-if="group.label && !ui.sidebarCollapsed" class="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-widest text-sidebar-muted/70">
          {{ group.label ? t(group.label) : '' }}
        </p>
        <div class="space-y-0.5">
          <button
            v-for="item in group.items" :key="item.to"
            v-show="isItemVisible(item)"
            @click="navigate(item)"
            :class="[
              'relative flex items-center rounded-md px-3 py-2 text-xs font-medium transition-all group w-full cursor-pointer',
              isActive(item.to) ? 'text-primary bg-primary/10' : 'text-sidebar-muted hover:text-sidebar-accent-foreground hover:bg-sidebar-accent',
              ui.sidebarCollapsed ? 'justify-center' : 'gap-3',
            ]"
            :title="ui.sidebarCollapsed ? t(item.label) : ''"
          >
            <div v-if="isActive(item.to) && !item.external && !ui.sidebarCollapsed" class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
            <component :is="item.icon" :class="['size-4 shrink-0', isActive(item.to) && !item.external ? 'text-primary' : '']" />
            <span v-if="!ui.sidebarCollapsed" class="truncate">{{ item.external ? item.label : t(item.label) }}</span>
          </button>
        </div>
      </div>
    </nav>
    <div class="p-2 border-t border-border/50">
      <button @click="handleLogout" class="flex items-center rounded-md px-3 py-2 text-xs font-medium text-sidebar-muted transition-all hover:bg-sidebar-accent hover:text-destructive group w-full cursor-pointer" :class="ui.sidebarCollapsed ? 'justify-center' : 'gap-3'" :title="ui.sidebarCollapsed ? t('auth.logout') : ''">
        <LogOut class="size-4 shrink-0" />
        <span v-if="!ui.sidebarCollapsed" class="truncate">{{ t('auth.logout') }}</span>
      </button>
    </div>
  </aside>
</template>

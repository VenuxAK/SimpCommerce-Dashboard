<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  LayoutDashboard, LogOut, X, Shield, UserCog, History, Building2,
  ChevronLeft, ChevronRight,
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

const navGroups = [
  {
    label: '',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
    ],
  },
  {
    label: 'nav.system',
    items: [
      { to: '/stores', icon: Building2, label: 'nav.stores' },
      { to: '/audit-logs', icon: History, label: 'nav.audit' },
      { to: '/users', icon: Shield, label: 'nav.users' },
      { to: '/profile', icon: UserCog, label: 'nav.profile' },
    ],
  },
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
    <div v-if="ui.sidebarCollapsed" class="flex justify-center py-3 border-b border-border/50 lg:flex hidden">
      <button @click="ui.toggleSidebar" class="size-7 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-sidebar-muted transition-colors">
        <ChevronRight class="size-3.5" />
      </button>
    </div>
    <nav class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-5">
      <div v-for="group in navGroups" :key="group.label">
        <p v-if="group.label && !ui.sidebarCollapsed" class="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-widest text-sidebar-muted/70">
          {{ t(group.label) }}
        </p>
        <div class="space-y-0.5">
          <button
            v-for="item in group.items" :key="item.to"
            @click="navigate(item.to)"
            :class="[
              'relative flex items-center rounded-md px-3 py-2 text-xs font-medium transition-all group w-full cursor-pointer',
              isActive(item.to) ? 'text-primary bg-primary/10' : 'text-sidebar-muted hover:text-sidebar-accent-foreground hover:bg-sidebar-accent',
              ui.sidebarCollapsed ? 'justify-center' : 'gap-3',
            ]"
            :title="ui.sidebarCollapsed ? t(item.label) : ''"
          >
            <div v-if="isActive(item.to) && !ui.sidebarCollapsed" class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
            <component :is="item.icon" :class="['size-4 shrink-0', isActive(item.to) ? 'text-primary' : '']" />
            <span v-if="!ui.sidebarCollapsed" class="truncate">{{ t(item.label) }}</span>
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

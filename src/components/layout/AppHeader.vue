<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Languages, Moon, Sun, LogOut, UserCircle, Palette, ChevronRight } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../lib/theme'
import { useUIStore, type ThemeColor } from '../../stores/ui'
import { useRouter } from 'vue-router'
import api from '../../lib/axios'

const { t } = useI18n()
const auth = useAuthStore()
const ui = useUIStore()
const themeState = useTheme()
const router = useRouter()
const route = useRoute()

const dropdownOpen = ref(false)
const themePickerOpen = ref(false)

const themes: { name: ThemeColor; color: string }[] = [
  { name: 'zinc', color: 'bg-zinc-500' },
  { name: 'blue', color: 'bg-blue-500' },
  { name: 'violet', color: 'bg-violet-500' },
  { name: 'rose', color: 'bg-rose-500' },
  { name: 'orange', color: 'bg-orange-500' },
  { name: 'emerald', color: 'bg-emerald-500' },
]

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'nav.dashboard',
  pos: 'nav.pos',
  products: 'nav.products',
  'product-create': 'products.new_product',
  'product-edit': 'products.edit_product',
  categories: 'nav.categories',
  customers: 'nav.customers',
  'customer-detail': 'customers.title',
  sales: 'nav.sales',
  'sale-detail': 'sales.title',
  invoices: 'nav.invoices',
  'invoice-detail': 'invoices.title',
  reports: 'nav.reports',
  discounts: 'nav.discounts',
  suppliers: 'nav.suppliers',
  stock: 'nav.stock',
  'cash-sessions': 'nav.cash',
  'audit-logs': 'nav.audit',
  users: 'nav.users',
  profile: 'nav.profile',
}

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.name)
  if (matched.length <= 1) return []
  return matched.slice(1).map(r => ({
    name: r.name as string,
    label: t(breadcrumbLabels[r.name as string] || r.name as string),
  }))
})

function toggleLang() {
  const next = locale.value === 'en' ? 'my' : 'en'
  locale.value = next
  localStorage.setItem('locale', next)
  document.documentElement.setAttribute('lang', next)
}

const { locale } = useI18n()

async function handleLogout() {
  try { await api.post('/auth/logout') } catch {}
  auth.logout()
  router.push('/login')
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (dropdownOpen.value && !target.closest('.profile-dropdown')) {
    dropdownOpen.value = false
    themePickerOpen.value = false
  }
}

onMounted(() => {
  document.documentElement.setAttribute('lang', locale.value)
  window.addEventListener('click', handleClickOutside)
})
onUnmounted(() => window.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="flex items-center justify-between w-full">
    <!-- Breadcrumbs -->
    <nav v-if="breadcrumbs.length" class="flex items-center gap-1.5 text-xs text-muted-foreground">
      <router-link to="/" class="hover:text-foreground transition-colors">{{ t('nav.dashboard') }}</router-link>
      <template v-for="(crumb, i) in breadcrumbs" :key="crumb.name">
        <ChevronRight class="size-3 text-muted-foreground/50" />
        <span v-if="i === breadcrumbs.length - 1" class="font-medium text-foreground">{{ crumb.label }}</span>
        <router-link v-else :to="{ name: crumb.name }" class="hover:text-foreground transition-colors">
          {{ crumb.label }}
        </router-link>
      </template>
    </nav>
    <div v-else />

    <!-- Actions -->
    <div class="flex items-center gap-1">
      <button
        @click="themeState.toggle()"
        class="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        :title="themeState.isDark.value ? 'Light mode' : 'Dark mode'"
      >
        <Sun v-if="themeState.isDark.value" class="size-4" />
        <Moon v-else class="size-4" />
      </button>

      <button
        @click="toggleLang"
        class="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
        :title="locale === 'en' ? 'မြန်မာ' : 'English'"
      >
        <Languages class="size-4" />
      </button>

      <div class="h-5 w-px bg-border mx-0.5" />

      <div class="relative profile-dropdown">
        <button
          @click="dropdownOpen = !dropdownOpen; themePickerOpen = false"
          class="flex items-center gap-2 rounded-md p-1.5 hover:bg-accent transition-all group"
        >
          <div class="size-7 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-medium text-xs border shadow-sm shrink-0">
            {{ auth.user?.name?.charAt(0) }}
          </div>
          <div class="hidden md:flex flex-col text-left leading-tight">
            <span class="text-xs font-medium text-foreground">{{ auth.user?.name }}</span>
            <span class="text-[10px] text-muted-foreground capitalize">{{ auth.user?.role }}</span>
          </div>
        </button>

        <div v-if="dropdownOpen"
          class="absolute right-0 mt-2 w-56 rounded-lg border bg-popover p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150 z-50 text-popover-foreground"
        >
          <div class="px-2.5 py-2 border-b mb-1">
            <p class="text-sm font-medium">{{ auth.user?.name }}</p>
            <p class="text-xs text-muted-foreground truncate mt-0.5">{{ auth.user?.email }}</p>
          </div>

          <div class="px-2.5 py-2 border-b mb-1">
            <div class="flex items-center justify-between">
              <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{{ t('common.theme_color') }}</p>
              <button @click="themePickerOpen = !themePickerOpen" class="text-muted-foreground hover:text-foreground transition-colors">
                <Palette class="size-3.5" />
              </button>
            </div>
            <div v-if="themePickerOpen" class="flex gap-1.5 mt-2">
              <button
                v-for="th in themes"
                :key="th.name"
                @click="ui.setTheme(th.name)"
                :class="[
                  'size-5 rounded-full border-2 transition-all',
                  th.color,
                  ui.theme === th.name ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'
                ]"
                :title="th.name"
              />
            </div>
          </div>

          <button
            @click="router.push('/profile'); dropdownOpen = false"
            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs hover:bg-accent transition-all"
          >
            <UserCircle class="size-4 text-muted-foreground" />
            <span>{{ t('nav.profile') }}</span>
          </button>

          <button
            @click="handleLogout"
            class="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-destructive hover:bg-destructive/10 transition-all mt-0.5"
          >
            <LogOut class="size-4" />
            <span>{{ t('auth.logout') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

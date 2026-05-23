<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Languages, User, Moon, Sun, ChevronDown, Settings, LogOut, UserCircle } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../lib/theme'
import { useUIStore, type ThemeColor } from '../../stores/ui'
import { useRouter } from 'vue-router'
import api from '../../lib/axios'

const { t, locale } = useI18n()
const auth = useAuthStore()
const ui = useUIStore()
const router = useRouter()
const { isDark, toggle } = useTheme()

const dropdownOpen = ref(false)

const themes: { name: ThemeColor; color: string }[] = [
  { name: 'zinc', color: 'bg-zinc-500' },
  { name: 'blue', color: 'bg-blue-500' },
  { name: 'violet', color: 'bg-violet-500' },
]

function toggleLang() {
  locale.value = locale.value === 'en' ? 'my' : 'en'
  localStorage.setItem('locale', locale.value)
}

async function handleLogout() {
  try { await api.post('/auth/logout') } catch {}
  auth.logout()
  router.push('/login')
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownOpen.value && !(e.target as HTMLElement).closest('.profile-dropdown')) {
    dropdownOpen.value = false
  }
}

onMounted(() => window.addEventListener('click', handleClickOutside))
onUnmounted(() => window.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="flex items-center gap-1.5 sm:gap-2">
    <button
      @click="toggle"
      class="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
      :title="isDark ? 'Light mode' : 'Dark mode'"
    >
      <Sun v-if="isDark" class="size-4.5" />
      <Moon v-else class="size-4.5" />
    </button>

    <button
      @click="toggleLang"
      class="flex h-9 items-center gap-2 rounded-md px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-secondary hover:text-foreground transition-all active:scale-95"
    >
      <Languages class="size-4" />
      <span>{{ locale === 'en' ? 'MY' : 'EN' }}</span>
    </button>

    <div class="h-4 w-px bg-border mx-1" />

    <div class="relative profile-dropdown">
      <button 
        @click="dropdownOpen = !dropdownOpen"
        class="flex items-center gap-2 pl-1 p-1 rounded-md hover:bg-secondary transition-all active:scale-95 group"
      >
        <div class="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm">
          {{ auth.user?.name?.charAt(0) }}
        </div>
        <div class="hidden md:flex flex-col text-left">
          <span class="text-xs font-bold text-foreground leading-none group-hover:text-primary transition-colors">{{ auth.user?.name }}</span>
          <span class="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-1">{{ auth.user?.role }}</span>
        </div>
        <ChevronDown :class="['size-3 text-muted-foreground transition-transform duration-200', dropdownOpen ? 'rotate-180' : '']" />
      </button>

      <div v-if="dropdownOpen" 
        class="absolute right-0 mt-2 w-56 rounded-md border border-zinc-200/60 dark:border-zinc-800/60 bg-card p-1 shadow-xl shadow-zinc-950/10 animate-in fade-in zoom-in-95 duration-200 z-50"
      >
        <div class="px-3 py-2 border-b border-border/50 mb-1">
          <p class="text-xs font-black text-foreground uppercase tracking-tight">{{ auth.user?.name }}</p>
          <p class="text-[10px] text-muted-foreground font-medium truncate">{{ auth.user?.email }}</p>
        </div>

        <div class="px-3 py-2 border-b border-border/50 mb-1">
          <p class="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Theme Color</p>
          <div class="flex gap-2">
            <button 
              v-for="th in themes" 
              :key="th.name"
              @click="ui.setTheme(th.name)"
              :class="[
                'size-5 rounded-full border-2 transition-all',
                th.color,
                ui.theme === th.name ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
              ]"
              :title="th.name.toUpperCase()"
            />
          </div>
        </div>
        
        <button 
          @click="router.push('/profile'); dropdownOpen = false"
          class="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <UserCircle class="size-3.5" />
          {{ t('nav.profile').toUpperCase() }}
        </button>
        
        <button 
          @click="handleLogout"
          class="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-all mt-1"
        >
          <LogOut class="size-3.5" />
          {{ t('auth.logout').toUpperCase() }}
        </button>
      </div>
    </div>
  </div>
</template>

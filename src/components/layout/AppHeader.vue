<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Languages, User, Moon, Sun } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../lib/theme'

const { t, locale } = useI18n()
const auth = useAuthStore()
const { isDark, toggle } = useTheme()

function toggleLang() {
  locale.value = locale.value === 'en' ? 'my' : 'en'
  localStorage.setItem('locale', locale.value)
}
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

    <div class="flex items-center gap-2 pl-1">
      <div class="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
        {{ auth.user?.name?.charAt(0) }}
      </div>
      <div class="hidden md:flex flex-col text-left">
        <span class="text-xs font-bold text-foreground leading-none">{{ auth.user?.name }}</span>
        <span class="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter mt-1">{{ auth.user?.role }}</span>
      </div>
    </div>
  </div>
</template>

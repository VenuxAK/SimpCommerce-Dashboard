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
  <div class="flex items-center gap-2">
    <button
      @click="toggle"
      class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      :title="isDark ? 'Light mode' : 'Dark mode'"
    >
      <Sun v-if="isDark" class="size-4" />
      <Moon v-else class="size-4" />
    </button>

    <button
      @click="toggleLang"
      class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
    >
      <Languages class="size-4" />
      <span class="hidden sm:inline">{{ locale === 'en' ? t('language.my') : t('language.en') }}</span>
    </button>

    <div class="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 ml-2">
      <User class="size-4" />
      <span class="hidden sm:inline">{{ auth.user?.name }}</span>
    </div>
  </div>
</template>

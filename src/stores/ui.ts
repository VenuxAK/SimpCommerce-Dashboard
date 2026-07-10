import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeColor = 'zinc' | 'blue' | 'violet' | 'rose' | 'orange' | 'emerald'

export const useUIStore = defineStore('ui', () => {
  const theme = ref<ThemeColor>((localStorage.getItem('theme-color') as ThemeColor) || 'zinc')
  const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
  const activeStoreSlug = ref('')

  watch(theme, (val) => {
    localStorage.setItem('theme-color', val)
    applyTheme(val)
  })

  watch(sidebarCollapsed, (val) => {
    localStorage.setItem('sidebar-collapsed', String(val))
  })

  function applyTheme(val: ThemeColor) {
    document.documentElement.setAttribute('data-theme', val)
  }

  // Initialize
  applyTheme(theme.value)

  return {
    theme,
    sidebarCollapsed,
    activeStoreSlug,
    toggleSidebar: () => sidebarCollapsed.value = !sidebarCollapsed.value,
    setTheme: (val: ThemeColor) => theme.value = val,
    setStore: (slug: string) => activeStoreSlug.value = slug,
  }
})

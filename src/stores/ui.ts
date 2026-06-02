import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type ThemeColor = 'zinc' | 'blue' | 'violet' | 'rose' | 'orange' | 'emerald'

const deploymentSlug = import.meta.env.VITE_STORE_SLUG || ''
const isFixed = !!deploymentSlug

export const useUIStore = defineStore('ui', () => {
  const theme = ref<ThemeColor>((localStorage.getItem('theme-color') as ThemeColor) || 'zinc')
  const sidebarCollapsed = ref(localStorage.getItem('sidebar-collapsed') === 'true')
  const activeStoreSlug = ref(isFixed ? deploymentSlug : (localStorage.getItem('active-store-slug') || ''))

  const isStoreFixed = computed(() => isFixed)

  watch(theme, (val) => {
    localStorage.setItem('theme-color', val)
    applyTheme(val)
  })

  watch(sidebarCollapsed, (val) => {
    localStorage.setItem('sidebar-collapsed', String(val))
  })

  watch(activeStoreSlug, (val) => {
    if (!isFixed) {
      localStorage.setItem('active-store-slug', val)
    }
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
    isStoreFixed,
    toggleSidebar: () => sidebarCollapsed.value = !sidebarCollapsed.value,
    setTheme: (val: ThemeColor) => theme.value = val,
    setStore: (slug: string) => { if (!isFixed) activeStoreSlug.value = slug },
  }
})

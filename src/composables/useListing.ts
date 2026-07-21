import { ref, onMounted, type Ref, watch } from 'vue'
import api from '../lib/axios'

export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export const useListing = <T>(endpoint: string, options?: {
  defaultParams?: Record<string, any>
  immediate?: boolean
  filterRefs?: Record<string, Ref<any>>
}) => {
  const items = ref<T[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const loading = ref(true)

  const loadPage = async (page = 1): Promise<void> => {
    loading.value = true
    try {
      const params: Record<string, any> = { page, ...options?.defaultParams }
      // Merge current filter values into params
      if (options?.filterRefs) {
        for (const [key, refVal] of Object.entries(options.filterRefs)) {
          const v = refVal.value
          if (v !== '' && v !== null && v !== undefined && v !== 'all') {
            params[key] = v
          }
        }
      }
      const { data } = await api.get(endpoint, { params })
      items.value = data.data
      meta.value = data.meta
    } catch {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  // Watch filter refs for changes
  if (options?.filterRefs) {
    watch(
      () => Object.values(options.filterRefs!).map(r => r.value),
      () => loadPage(1),
      { deep: false },
    )
  }

  if (options?.immediate !== false) {
    onMounted(() => loadPage(1))
  }

  return { items, meta, loading, loadPage }
}

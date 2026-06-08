import { ref, onMounted } from 'vue'
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
}) => {
  const items = ref<T[]>([])
  const meta = ref<PaginationMeta | null>(null)
  const loading = ref(true)

  const loadPage = async (page = 1): Promise<void> => {
    loading.value = true
    try {
      const params: Record<string, any> = { page, ...options?.defaultParams }
      const { data } = await api.get(endpoint, { params })
      items.value = data.data
      meta.value = data.meta
    } catch {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  if (options?.immediate !== false) {
    onMounted(() => loadPage(1))
  }

  return { items, meta, loading, loadPage }
}

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Plus, Pencil, LayoutGrid, List, Download, Upload } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import { useNotify } from '../lib/notify'
import Pagination from '../components/Pagination.vue'
import type { Product, Category } from '../types'

const { t } = useI18n()
const router = useRouter()
const { success, error } = useNotify()
function imgUrl(product: Product): string | null {
  return product.image_url || null
}

const importInput = ref<HTMLInputElement | null>(null)

async function exportCsv() {
  const response = await api.get('/products/export/csv', { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'products.csv'; link.click()
  URL.revokeObjectURL(url)
}

async function onImportCsv(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  const fd = new FormData()
  fd.append('file', target.files[0])
  try {
    const res = await api.post('/products/import/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    success(`Imported ${res.data.created} products ✅`)
    loadPage(1)
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
  target.value = ''
}
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const meta = ref<any>(null)
const search = ref('')
const categoryFilter = ref<number | ''>('')
const viewMode = ref<'grid' | 'list'>('list')
const loading = ref(true)

async function loadPage(page = 1) {
  loading.value = true
  try {
    const [pRes, cRes] = await Promise.all([
      api.get('/products', { params: { page } }),
      api.get('/categories'),
    ])
    products.value = pRes.data.data
    categories.value = cRes.data.data
    meta.value = { current_page: pRes.data.meta.current_page, last_page: pRes.data.meta.last_page, total: pRes.data.meta.total, per_page: pRes.data.meta.per_page }
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage())

const filtered = computed(() =>
  products.value.filter((p) => {
    if (categoryFilter.value && p.category_id !== categoryFilter.value) return false
    if (search.value && !p.name.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  }),
)

function totalStock(variants: { stock_quantity: number }[]) {
  return variants.reduce((s, v) => s + v.stock_quantity, 0)
}

function stockBadge(stock: number) {
  if (stock === 0) return 'destructive' as const
  if (stock < 10) return 'warning' as const
  return 'secondary' as const
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('products.title') }}</h1>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="importInput?.click()" class="w-full sm:w-auto">
          <Upload class="size-4" /> Import
        </Button>
        <button @click="exportCsv" class="inline-flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <Download class="size-4" /> Export
        </button>
        <Button @click="router.push('/products/new')" class="w-full sm:w-auto">
          <Plus class="size-4" /> {{ t('products.new_product') }}
        </Button>
        <input ref="importInput" type="file" accept=".csv" class="hidden" @change="onImportCsv" />
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-2">
      <Input v-model="search" :placeholder="t('common.search')" class="sm:max-w-xs" />
      <div class="flex gap-2">
        <select v-model="categoryFilter" class="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 flex-1 sm:flex-initial">
          <option value="">{{ t('common.all') }}</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
        <div class="flex rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <button @click="viewMode = 'grid'"
            :class="['px-2 py-1.5 transition-colors', viewMode === 'grid' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300']">
            <LayoutGrid class="size-4" />
          </button>
          <button @click="viewMode = 'list'"
            :class="['px-2 py-1.5 transition-colors', viewMode === 'list' ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300']">
            <List class="size-4" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

    <!-- List View -->
    <Card v-if="!loading && viewMode === 'list'">
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('products.product_name') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden sm:table-cell">{{ t('products.category') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('products.base_price') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden sm:table-cell">{{ t('products.variants') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('products.stock') }}</th>
              <th class="px-3 sm:px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id" class="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
              <td class="px-3 sm:px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-32 sm:max-w-none">{{ p.name }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400 truncate max-w-28 hidden sm:table-cell">{{ p.category?.name }}</td>
              <td class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-700 dark:text-zinc-300">{{ p.base_price.toLocaleString() }} Ks</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 hidden sm:table-cell">{{ p.variants.length }}</td>
              <td class="px-3 sm:px-4 py-3 text-right">
                <Badge :variant="stockBadge(totalStock(p.variants))">
                  {{ totalStock(p.variants) }}
                </Badge>
              </td>
              <td class="px-3 sm:px-4 py-3 text-right">
                <Button variant="ghost" size="icon" @click="router.push('/products/' + p.id + '/edit')" class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                  <Pencil class="size-4" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <!-- Grid View -->
    <div v-if="!loading && viewMode === 'grid'">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <Card v-for="p in filtered" :key="p.id"
          class="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
          @click="router.push('/products/' + p.id + '/edit')"
        >
          <CardContent class="p-3 sm:p-4 space-y-2">
            <div class="flex h-16 sm:h-20 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
              <img v-if="imgUrl(p)" :src="imgUrl(p)!" :alt="p.name" class="size-full object-cover" />
              <span v-else class="text-2xl">👕</span>
            </div>
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ p.name }}</p>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 truncate">{{ p.category?.name }}</p>
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-zinc-900 dark:text-zinc-100">{{ p.base_price.toLocaleString() }} Ks</span>
              <Badge :variant="stockBadge(totalStock(p.variants))">{{ totalStock(p.variants) }}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <p v-if="!loading && filtered.length === 0" class="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">{{ t('common.no_data') }}</p>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

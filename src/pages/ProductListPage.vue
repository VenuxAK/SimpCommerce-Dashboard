<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Plus, Pencil, LayoutGrid, List, Download, Upload, Check } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
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

const categoryOptions = computed(() => [
  { label: t('common.all').toUpperCase() + ' CATEGORIES', value: '' },
  ...categories.value.map(c => ({ label: c.name.toUpperCase(), value: c.id }))
])

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
  <div class="space-y-6 animate-in fade-in duration-500">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-foreground uppercase italic">{{ t('products.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">Manage your product catalog and variants</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="importInput?.click()" class="h-9 px-4">
          <Upload class="size-3.5" /> <span class="ml-1">IMPORT</span>
        </Button>
        <Button variant="outline" size="sm" @click="exportCsv" class="h-9 px-4">
          <Download class="size-3.5" /> <span class="ml-1">EXPORT</span>
        </Button>
        <Button size="sm" @click="router.push('/products/new')" class="h-9 px-4">
          <Plus class="size-3.5" /> <span class="ml-1">{{ t('products.new_product').toUpperCase() }}</span>
        </Button>
        <input ref="importInput" type="file" accept=".csv" class="hidden" @change="onImportCsv" />
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-3">
      <Input v-model="search" :placeholder="t('common.search').toUpperCase() + '...'" class="sm:max-w-xs h-9" />
      <div class="flex gap-2">
        <Select v-model="categoryFilter" :options="categoryOptions" class="min-w-[180px]" />
        <div class="flex p-0.5 rounded-md border border-input bg-card">
          <button @click="viewMode = 'grid'"
            :class="['p-1.5 rounded-sm transition-all', viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
            <LayoutGrid class="size-3.5" />
          </button>
          <button @click="viewMode = 'list'"
            :class="['p-1.5 rounded-sm transition-all', viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
            <List class="size-3.5" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
      <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <!-- List View -->
    <Card v-if="!loading && viewMode === 'list'" class="overflow-hidden border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b bg-muted/30">
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('products.product_name') }}</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">{{ t('products.category') }}</th>
              <th class="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('products.base_price') }}</th>
              <th class="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">{{ t('products.variants') }}</th>
              <th class="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('products.stock') }}</th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/40">
            <tr v-for="p in filtered" :key="p.id" class="group hover:bg-muted/30 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="size-10 rounded-md overflow-hidden bg-secondary/50 border border-border/50 shrink-0">
                    <img v-if="imgUrl(p)" :src="imgUrl(p)!" :alt="p.name" class="size-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    <span v-else class="flex size-full items-center justify-center text-lg opacity-20">👕</span>
                  </div>
                  <span class="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{{ p.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-xs font-medium text-muted-foreground hidden sm:table-cell uppercase tracking-tight">{{ p.category?.name }}</td>
              <td class="px-6 py-4 text-right text-sm font-black text-foreground tabular-nums">{{ p.base_price.toLocaleString() }} Ks</td>
              <td class="px-6 py-4 text-right text-xs font-bold text-muted-foreground hidden sm:table-cell uppercase">{{ p.variants.length }} VAR</td>
              <td class="px-6 py-4 text-right">
                <Badge :variant="stockBadge(totalStock(p.variants))" class="px-2 py-0">
                  {{ totalStock(p.variants) }}
                </Badge>
              </td>
              <td class="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" @click="router.push('/products/' + p.id + '/edit')" class="size-8 text-muted-foreground hover:text-primary">
                  <Pencil class="size-3.5" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <!-- Grid View -->
    <div v-if="!loading && viewMode === 'grid'">
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div v-for="p in filtered" :key="p.id"
          class="group cursor-pointer rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-card p-1.5 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/50 transition-all duration-300"
          @click="router.push('/products/' + p.id + '/edit')"
        >
          <div class="relative aspect-square mb-2 overflow-hidden rounded-lg bg-secondary/30">
            <img v-if="imgUrl(p)" :src="imgUrl(p)!" :alt="p.name" class="size-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
            <div v-else class="flex size-full items-center justify-center text-3xl grayscale opacity-20">👕</div>
          </div>
          <div class="px-1.5 pb-1.5">
            <p class="text-xs font-black text-foreground uppercase tracking-tight truncate">{{ p.name }}</p>
            <div class="flex items-center justify-between mt-1">
              <span class="text-sm font-black text-primary tracking-tighter tabular-nums">{{ p.base_price.toLocaleString() }} Ks</span>
              <Badge :variant="stockBadge(totalStock(p.variants))" class="px-1.5 py-0 text-[8px]">{{ totalStock(p.variants) }}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!loading && filtered.length === 0" class="text-xs font-bold text-muted-foreground py-12 text-center uppercase tracking-widest">{{ t('common.no_data') }}</p>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

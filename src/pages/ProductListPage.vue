<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Plus, Pencil, LayoutGrid, List, Download, Upload, Check, Search, Filter, MoreHorizontal, Trash2, Package } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import { Badge } from '../components/ui/badge'
import Pagination from '../components/Pagination.vue'
import { useNotify } from '../lib/notify'
import type { Product, Category } from '../types'

const { t } = useI18n()
const router = useRouter()
const { success, error } = useNotify()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const meta = ref<any>({})
const page = ref(1)
const viewMode = ref<'list' | 'grid'>('list')

// Filters
const search = ref('')
const categoryId = ref<number | ''>('')
const stockStatus = ref<'all' | 'low' | 'out'>('all')

const statusOptions = [
  { label: 'ALL STOCK', value: 'all' },
  { label: 'LOW STOCK', value: 'low' },
  { label: 'OUT OF STOCK', value: 'out' },
]

async function load(p = 1) {
  loading.value = true
  page.value = p
  try {
    const [prodRes, catRes] = await Promise.all([
      api.get('/products', {
        params: {
          page: p,
          search: search.value,
          category_id: categoryId.value,
          stock: stockStatus.value !== 'all' ? stockStatus.value : undefined,
        },
      }),
      api.get('/categories'),
    ])
    products.value = prodRes.data.data
    meta.value = prodRes.data.meta
    categories.value = catRes.data.data
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

const categoryOptions = computed(() => [
  { label: 'ALL CATEGORIES', value: '' },
  ...categories.value.map(c => ({ label: c.name.toUpperCase(), value: c.id }))
])

let timer: any
watch([search, categoryId, stockStatus], () => {
  clearTimeout(timer)
  timer = setTimeout(() => load(1), 300)
})

onMounted(() => load(1))

function loadPage(p: number) {
  load(p)
}

async function exportCsv() {
  try {
    const res = await api.get('/products/export/csv', { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch {
    error('Export failed')
  }
}

function getStockBadge(qty: number) {
  if (qty === 0) return { variant: 'destructive', label: 'OUT' }
  if (qty < 10) return { variant: 'warning', label: 'LOW' }
  return { variant: 'success', label: 'IN' }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ t('products.title') }}</h1>
        <p class="text-xs text-muted-foreground mt-1">Manage your inventory and product variants</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" @click="exportCsv">
          <Download class="size-3.5 mr-2" /> Export
        </Button>
        <Button size="sm" @click="router.push('/products/new')">
          <Plus class="size-3.5 mr-2" /> {{ t('products.new_product') }}
        </Button>
      </div>
    </div>

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input v-model="search" :placeholder="t('common.search')" class="pl-9 h-9 text-xs border-border/40 shadow-none bg-background" />
          </div>
          <div class="flex flex-wrap gap-3">
            <Select v-model="categoryId" :options="categoryOptions" class="w-48 h-9 text-xs border-border/40 bg-background" />
            <Select v-model="stockStatus" :options="statusOptions" class="w-40 h-9 text-xs border-border/40 bg-background" />
            <div class="flex items-center border border-border/40 rounded-md bg-background p-0.5">
              <button @click="viewMode = 'list'" :class="['p-1.5 rounded-sm transition-all', viewMode === 'list' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
                <List class="size-3.5" />
              </button>
              <button @click="viewMode = 'grid'" :class="['p-1.5 rounded-sm transition-all', viewMode === 'grid' ? 'bg-secondary text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
                <LayoutGrid class="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
      <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else-if="products.length === 0" class="py-20 text-center border rounded-xl border-dashed">
      <Package class="size-10 mx-auto text-muted-foreground/20 mb-4" />
      <p class="text-sm font-medium text-muted-foreground">{{ t('common.no_data') }}</p>
    </div>

    <div v-else>
      <div v-if="viewMode === 'list'" class="border rounded-lg overflow-hidden bg-card">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b bg-muted/20">
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider w-16">Image</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('products.product_name') }}</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('products.category') }}</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('products.base_price') }}</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">Stock</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="product in products" :key="product.id" class="hover:bg-muted/30 transition-colors group">
                <td class="px-4 py-2">
                  <div class="size-10 rounded border bg-muted/50 overflow-hidden shrink-0">
                    <img v-if="product.image_url" :src="product.image_url" class="size-full object-cover" />
                    <div v-else class="size-full flex items-center justify-center opacity-10">👕</div>
                  </div>
                </td>
                <td class="px-4 py-2">
                  <p class="font-semibold text-foreground group-hover:text-primary transition-colors">{{ product.name }}</p>
                  <p class="text-[10px] text-muted-foreground mt-0.5">{{ product.variants?.length || 0 }} variants</p>
                </td>
                <td class="px-4 py-2">
                  <Badge variant="outline" class="font-medium text-[10px]">{{ product.category?.name || 'Uncategorized' }}</Badge>
                </td>
                <td class="px-4 py-2 text-right font-medium tabular-nums">{{ product.base_price.toLocaleString() }} Ks</td>
                <td class="px-4 py-2 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="font-bold tabular-nums">{{ product.total_stock }}</span>
                    <Badge :variant="getStockBadge(product.total_stock).variant as any" class="h-3.5 px-1 text-[8px] font-bold">
                      {{ getStockBadge(product.total_stock).label }}
                    </Badge>
                  </div>
                </td>
                <td class="px-4 py-2 text-right">
                  <Button variant="ghost" size="icon" class="size-7" @click="router.push(`/products/${product.id}/edit`)">
                    <Pencil class="size-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card v-for="product in products" :key="product.id" class="group overflow-hidden hover:border-primary/40 transition-all">
          <div class="relative aspect-square bg-muted/20 border-b">
            <img v-if="product.image_url" :src="product.image_url" class="size-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
            <div v-else class="size-full flex items-center justify-center opacity-10 text-4xl">👕</div>
            <div class="absolute top-2 right-2">
              <Badge :variant="getStockBadge(product.total_stock).variant as any" class="text-[9px] font-bold border-none shadow-sm">
                {{ product.total_stock }} LEFT
              </Badge>
            </div>
          </div>
          <CardContent class="p-4">
            <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{{ product.category?.name }}</p>
            <h3 class="font-semibold text-sm mt-1 truncate">{{ product.name }}</h3>
            <div class="flex items-center justify-between mt-4">
              <p class="font-bold text-sm text-primary tabular-nums">{{ product.base_price.toLocaleString() }} Ks</p>
              <Button variant="outline" size="icon" class="size-7 rounded-full" @click="router.push(`/products/${product.id}/edit`)">
                <Pencil class="size-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div class="pt-8">
        <Pagination :meta="meta" @page="loadPage" />
      </div>
    </div>
  </div>
</template>

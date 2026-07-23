<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import Input from '../../components/ui/Input.vue'
import Select from '../../components/ui/Select.vue'
import Pagination from '../../components/Pagination.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import PageHeader from '../../components/PageHeader.vue'
import { useListing, statusBadge } from '../../composables'
import type { StockMovement, Product } from '../../types'
import { PackageSearch, AlertTriangle, ClipboardList, ArrowUpDown } from 'lucide-vue-next'
import api from '../../lib/axios'

const { t } = useI18n()

const activeTab = ref<'levels' | 'movements'>('levels')

// ── Stock Levels tab ──
const levelFilter = ref<'all' | 'low' | 'out'>('all')
const levelProducts = ref<Product[]>([])
const levelLoading = ref(false)
const levelMeta = ref<{ current_page: number; last_page: number; total: number; per_page: number } | null>(null)
const levelPage = ref(1)

const levelOptions = [
  { label: t('stock.all_stock').toUpperCase(), value: 'all' },
  { label: t('stock.low_stock_filter').toUpperCase(), value: 'low' },
  { label: t('stock.out_of_stock_filter').toUpperCase(), value: 'out' },
]

const loadLevels = async (page = 1) => {
  levelLoading.value = true
  levelPage.value = page
  try {
    const params: Record<string, any> = { per_page: 30, page }
    if (levelFilter.value !== 'all') {
      params.stock_status = levelFilter.value
    }
    const { data } = await api.get('/products', { params })
    levelProducts.value = data.data
    levelMeta.value = data.meta
  } catch {
    levelProducts.value = []
    levelMeta.value = null
  } finally {
    levelLoading.value = false
  }
}

onMounted(() => loadLevels(1))

// Flatten all variants from products for display, filtered by stock status
const stockItems = computed(() => {
  const items: Array<{
    productName: string
    productId: number
    variantId: number
    sku: string
    size: string | null
    color: string | null
    stock: number
    threshold: number
    status: 'out' | 'low' | 'ok'
    image: string | null
  }> = []

  for (const p of levelProducts.value) {
    for (const v of p.variants || []) {
      const stock = v.stock_quantity ?? 0
      const threshold = (v as any).low_stock_threshold ?? 10
      let status: 'out' | 'low' | 'ok'
      if (stock === 0) status = 'out'
      else if (threshold > 0 && stock <= threshold) status = 'low'
      else status = 'ok'

      if (levelFilter.value === 'all' || status === levelFilter.value) {
        items.push({
          productName: p.name,
          productId: p.id,
          variantId: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock,
          threshold,
          status,
          image: (v as any).image_url || p.image_url || p.image,
        })
      }
    }
  }

  // Sort: out first, then low, then ok; within status, lowest stock first
  const statusOrder = { out: 0, low: 1, ok: 2 }
  items.sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.stock - b.stock)
  return items
})

// ── Movements tab (existing) ──
const dateFrom = ref('')
const dateTo = ref('')
const reasonFilter = ref('')

const { items: movements, meta, loading: moveLoading, loadPage } = useListing<StockMovement>('/stock-movements', {
  immediate: false,
  filterRefs: { date_from: dateFrom, date_to: dateTo, reason: reasonFilter },
})

const reasonOptions = [
  { label: t('common.all'), value: '' },
  { label: t('validation.sale').toUpperCase(), value: 'sale' },
  { label: t('validation.adjustment').toUpperCase(), value: 'adjustment' },
  { label: t('validation.cancel').toUpperCase(), value: 'cancelled' },
  { label: t('validation.refund').toUpperCase(), value: 'refunded' },
]

loadPage(1)

const reasonLabel = (r: string) => {
  const map: Record<string, string> = {
    sale: t('validation.sale'), adjustment: t('validation.adjustment'),
    cancelled: t('validation.cancel'), refunded: t('validation.refund'),
  }
  return map[r] || r
}

const stockBadge = (s: string) => {
  if (s === 'out') return 'destructive'
  if (s === 'low') return 'warning'
  return 'success'
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader :title="t('nav.stock')" :subtitle="t('stock.manage')" />

    <!-- Tab switcher -->
    <div class="flex items-center gap-1 bg-muted rounded-md p-0.5 w-fit">
      <button
        @click="activeTab = 'levels'"
        :class="['px-4 py-1.5 text-xs rounded-sm transition-all font-medium', activeTab === 'levels' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
        <AlertTriangle class="size-3.5 inline mr-1.5" />{{ t('stock.stock_levels') }}
      </button>
      <button
        @click="activeTab = 'movements'"
        :class="['px-4 py-1.5 text-xs rounded-sm transition-all font-medium', activeTab === 'movements' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground']">
        <ArrowUpDown class="size-3.5 inline mr-1.5" />{{ t('stock.movements') }}
      </button>
    </div>

    <!-- ===== Stock Levels Tab ===== -->
    <template v-if="activeTab === 'levels'">
      <Card class="shadow-none border-border/60 bg-muted/5">
        <CardContent class="p-4">
          <div class="flex flex-wrap items-center gap-3">
            <Select v-model="levelFilter" :options="levelOptions" class="w-48 h-9 text-xs bg-background" @update:model-value="levelFilter = $event as any; loadLevels(1)" />
          </div>
        </CardContent>
      </Card>

      <LoadingSpinner v-if="levelLoading" />

      <EmptyState v-else-if="stockItems.length === 0" :icon="PackageSearch" :title="t('common.no_data')" />

      <div v-else class="border rounded-lg overflow-hidden bg-card">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b bg-muted/20">
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('products.product_name') }}</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('products.sku') }}</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{{ t('products.variant') }}</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('products.stock') }}</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right hidden sm:table-cell">{{ t('stock.threshold') }}</th>
                <th class="px-4 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">{{ t('common.status') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="item in stockItems" :key="item.variantId" class="hover:bg-muted/30 transition-colors group">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <div class="size-8 rounded border bg-muted/50 overflow-hidden shrink-0">
                      <img v-if="item.image" :src="item.image" class="size-full object-cover" />
                      <span v-else class="flex size-full items-center justify-center text-xs opacity-20">&#x1F455;</span>
                    </div>
                    <span class="font-semibold text-foreground truncate max-w-[180px]">{{ item.productName }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-muted-foreground font-mono text-[11px]">{{ item.sku }}</td>
                <td class="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                  <span v-if="item.size || item.color" class="uppercase tracking-tight">{{ item.size }} / {{ item.color }}</span>
                  <span v-else class="text-muted-foreground/40">—</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span :class="['font-bold tabular-nums', item.status === 'out' ? 'text-destructive' : item.status === 'low' ? 'text-amber-500' : 'text-foreground']">
                    {{ item.stock }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-muted-foreground tabular-nums hidden sm:table-cell">{{ item.threshold }}</td>
                <td class="px-4 py-3 text-center">
                  <Badge :variant="stockBadge(item.status) as any" class="h-5 px-2 text-[9px] font-medium uppercase">
                    {{ item.status === 'out' ? t('stock.status_out').toUpperCase() : item.status === 'low' ? t('stock.status_low').toUpperCase() : t('stock.status_ok').toUpperCase() }}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="pt-8" v-if="levelMeta && levelMeta.last_page > 1">
        <Pagination :meta="levelMeta" @page="(p: number) => loadLevels(p)" />
      </div>
    </template>

    <!-- ===== Movements Tab (existing) ===== -->
    <template v-if="activeTab === 'movements'">
      <Card class="shadow-none border-border/60 bg-muted/5">
        <CardContent class="p-4">
          <div class="flex flex-wrap items-center gap-3">
            <Input v-model="dateFrom" type="date" class="w-40 h-9 text-xs bg-background" />
            <span class="text-xs text-muted-foreground">to</span>
            <Input v-model="dateTo" type="date" class="w-40 h-9 text-xs bg-background" />
            <Select v-model="reasonFilter" :options="reasonOptions" class="w-48 h-9 text-xs bg-background" />
          </div>
        </CardContent>
      </Card>

      <LoadingSpinner v-if="moveLoading" />

      <EmptyState v-else-if="movements.length === 0" :icon="PackageSearch" :title="t('common.no_data')" />

      <div v-else class="border rounded-lg overflow-hidden bg-card">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b bg-muted/20">
                <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('common.date') }}</th>
                <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('products.product_name') }}</th>
                <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{{ t('products.variant') }}</th>
                <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('validation.movement') }}</th>
                <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('validation.reason') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="m in movements" :key="m.id" class="hover:bg-muted/30 transition-colors group">
                <td class="px-6 py-4 text-muted-foreground tabular-nums">
                  {{ m.created_at?.split('T')[0] }}
                </td>
                <td class="px-6 py-4 font-semibold text-foreground">
                  {{ m.variant?.product?.name || '—' }}
                </td>
                <td class="px-6 py-4 text-muted-foreground">
                  <div class="flex items-center gap-1.5 uppercase tracking-tight">
                    {{ m.variant?.size }} / {{ m.variant?.color }}
                    <span class="text-[10px] opacity-40">({{ m.variant?.sku }})</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <span :class="m.quantity_change > 0 ? 'text-success' : 'text-destructive'" class="font-bold tabular-nums">
                    {{ m.quantity_change > 0 ? '+' : '' }}{{ m.quantity_change }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <Badge :variant="statusBadge(m.reason) as any" class="h-5 px-2 text-[9px] font-medium uppercase">
                    {{ reasonLabel(m.reason) }}
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="pt-8">
        <Pagination :meta="meta" @page="loadPage" />
      </div>
    </template>
  </div>
</template>

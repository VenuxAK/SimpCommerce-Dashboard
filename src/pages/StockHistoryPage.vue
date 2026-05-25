<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import Pagination from '../components/Pagination.vue'
import { useNotify } from '../lib/notify'
import type { StockMovement } from '../types'
import { PackageSearch } from 'lucide-vue-next'

const { t } = useI18n()
const { error } = useNotify()
const movements = ref<StockMovement[]>([])
const meta = ref<any>(null)
const loading = ref(true)
const dateFrom = ref('')
const dateTo = ref('')
const reasonFilter = ref('')

const reasonOptions = [
  { label: 'ALL REASONS', value: '' },
  { label: 'SALE', value: 'sale' },
  { label: 'ADJUSTMENT', value: 'adjustment' },
  { label: 'CANCELLED', value: 'cancelled' },
  { label: 'REFUNDED', value: 'refunded' },
]

onMounted(() => loadPage())

watch([reasonFilter, dateFrom, dateTo], () => loadPage(1))

async function loadPage(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string> = { page: String(page) }
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    if (reasonFilter.value) params.reason = reasonFilter.value
    const { data } = await api.get('/stock-movements', { params })
    movements.value = data.data
    meta.value = data.meta
  } catch (e: any) { error(e?.response?.data?.message || t('dashboard.load_failed')) }
  finally { loading.value = false }
}

const reasonBadge = (r: string) => ({
  sale: 'secondary', adjustment: 'warning',
  cancelled: 'destructive', refunded: 'success',
})[r] || 'default'

const reasonLabel = (r: string) => {
  const map: Record<string, string> = {
    sale: t('validation.sale'), adjustment: t('validation.adjustment'),
    cancelled: t('validation.cancel'), refunded: t('validation.refund'),
  }
  return map[r] || r
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ t('nav.stock') }}</h1>
        <p class="text-xs text-muted-foreground mt-1">Audit log of all inventory changes and adjustments</p>
      </div>
    </div>

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

    <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
      <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else-if="movements.length === 0" class="py-20 text-center border border-dashed rounded-xl">
      <PackageSearch class="size-10 mx-auto text-muted-foreground/20 mb-4" />
      <p class="text-sm font-medium text-muted-foreground">{{ t('common.no_data') }}</p>
    </div>

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
                <Badge :variant="reasonBadge(m.reason) as any" class="h-5 px-2 text-[9px] font-medium uppercase">
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
  </div>
</template>

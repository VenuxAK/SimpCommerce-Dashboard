<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import Pagination from '../components/Pagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import { useListing, useDebouncedWatch, statusBadge } from '../composables'
import type { StockMovement } from '../types'
import { PackageSearch } from 'lucide-vue-next'

const { t } = useI18n()

const { items: movements, meta, loading, loadPage } = useListing<StockMovement>('/stock-movements', { immediate: false })

const dateFrom = ref('')
const dateTo = ref('')
const reasonFilter = ref('')

const reasonOptions = [
  { label: t('common.all'), value: '' },
  { label: t('validation.sale').toUpperCase(), value: 'sale' },
  { label: t('validation.adjustment').toUpperCase(), value: 'adjustment' },
  { label: t('validation.cancel').toUpperCase(), value: 'cancelled' },
  { label: t('validation.refund').toUpperCase(), value: 'refunded' },
]

useDebouncedWatch([reasonFilter, dateFrom, dateTo], () => loadPage(1))

loadPage(1)

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
    <PageHeader :title="t('nav.stock')" :subtitle="t('stock.manage')" />

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

    <LoadingSpinner v-if="loading" />

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../lib/axios'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import { useNotify } from '../lib/notify'
import Pagination from '../components/Pagination.vue'
import type { Order } from '../types'

const { t } = useI18n()
const router = useRouter()
const { error } = useNotify()
const orders = ref<Order[]>([])
const meta = ref<any>(null)
const dateFrom = ref('')
const dateTo = ref('')
const statusFilter = ref('')
const loading = ref(true)

const statusOptions = [
  { label: t('common.all').toUpperCase() + ' STATUS', value: '' },
  { label: t('sales.status_completed').toUpperCase(), value: 'completed' },
  { label: t('sales.status_cancelled').toUpperCase(), value: 'cancelled' },
  { label: t('sales.status_refunded').toUpperCase(), value: 'refunded' },
  { label: t('sales.status_pending').toUpperCase(), value: 'pending' },
]

async function loadPage(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string> = { page: String(page) }
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get('/orders', { params })
    orders.value = data.data
    meta.value = { current_page: data.meta.current_page, last_page: data.meta.last_page, total: data.meta.total, per_page: data.meta.per_page }
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage())

watch(statusFilter, () => loadPage(1))
watch([dateFrom, dateTo], () => loadPage(1))

function statusBadge(status: string) {
  const map: Record<string, string> = { completed: 'success', pending: 'warning', cancelled: 'destructive', refunded: 'secondary' }
  return map[status] || 'default'
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    completed: t('sales.status_completed'),
    cancelled: t('sales.status_cancelled'),
    refunded: t('sales.status_refunded'),
    pending: t('sales.status_pending'),
  }
  return map[s] || s
}
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black tracking-tight text-foreground uppercase italic">{{ t('sales.title') }}</h1>
        <p class="text-sm text-muted-foreground mt-1">Review and manage your store transactions</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      <Input v-model="dateFrom" type="date" class="w-40 h-10" />
      <Input v-model="dateTo" type="date" class="w-40 h-10" />
      <Select v-model="statusFilter" :options="statusOptions" class="min-w-[180px]" />
    </div>

    <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
      <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <p v-else-if="!loading && orders.length === 0" class="text-xs font-bold text-muted-foreground py-12 text-center uppercase tracking-widest">{{ t('common.no_data') }}</p>

    <Card v-else-if="orders.length" class="overflow-hidden border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b bg-muted/30">
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('sales.order_number') }}</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">{{ t('sales.customer') }}</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('common.date') }}</th>
              <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('common.status') }}</th>
              <th class="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ t('sales.total') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/40">
            <tr v-for="order in orders" :key="order.id"
              class="group hover:bg-muted/30 cursor-pointer transition-colors"
              @click="router.push('/sales/' + order.id)"
            >
              <td class="px-6 py-4">
                <span class="text-sm font-bold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{{ order.order_number }}</span>
              </td>
              <td class="px-6 py-4 text-xs font-medium text-muted-foreground hidden sm:table-cell uppercase tracking-tight">{{ order.customer?.name || '—' }}</td>
              <td class="px-6 py-4 text-xs font-bold text-muted-foreground whitespace-nowrap">{{ order.created_at?.split('T')[0] }}</td>
              <td class="px-6 py-4">
                <Badge :variant="statusBadge(order.status) as any" class="px-2 py-0 text-[10px] font-black uppercase">{{ statusLabel(order.status) }}</Badge>
              </td>
              <td class="px-6 py-4 text-right text-sm font-black text-foreground tabular-nums whitespace-nowrap">{{ order.total_amount.toLocaleString() }} Ks</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

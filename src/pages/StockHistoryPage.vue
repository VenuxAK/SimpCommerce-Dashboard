<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import Pagination from '../components/Pagination.vue'
import { useNotify } from '../lib/notify'

const { t } = useI18n()
const { error } = useNotify()
const movements = ref<any[]>([])
const meta = ref<any>(null)
const loading = ref(true)
const dateFrom = ref('')
const dateTo = ref('')
const reasonFilter = ref('')

onMounted(() => loadPage())

async function loadPage(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string> = { page: String(page) }
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    if (reasonFilter.value) params.reason = reasonFilter.value
    const { data } = await api.get('/stock-movements', { params })
    movements.value = data.data
    meta.value = { current_page: data.meta.current_page, last_page: data.meta.last_page, total: data.meta.total, per_page: data.meta.per_page }
  } catch (e: any) { error(e?.response?.data?.message || t('dashboard.load_failed')) }
  finally { loading.value = false }
}

const reasonBadge = (r: string) => ({
  sale: 'destructive', adjustment: 'warning',
  cancelled: 'secondary', refunded: 'default',
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
  <div class="space-y-4">
    <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('nav.stock') }}</h1>

    <div class="flex flex-wrap gap-2">
      <Input v-model="dateFrom" type="date" class="w-36 sm:w-40" />
      <Input v-model="dateTo" type="date" class="w-36 sm:w-40" />
      <select v-model="reasonFilter" @change="loadPage(1)"
        class="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
        <option value="">{{ t('common.all') }}</option>
        <option value="sale">{{ t('validation.sale') }}</option>
        <option value="adjustment">{{ t('validation.adjustment') }}</option>
        <option value="cancelled">{{ t('validation.cancel') }}</option>
        <option value="refunded">{{ t('validation.refund') }}</option>
      </select>
    </div>

    <div v-if="loading" class="text-sm text-zinc-400">{{ t('common.loading') }}</div>

    <Card v-else>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.date') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('products.product_name') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('products.variant') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('validation.movement') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('validation.reason') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in movements" :key="m.id" class="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
              <td class="px-3 sm:px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{{ m.created_at?.split('T')[0] }}</td>
              <td class="px-3 sm:px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-32">{{ m.variant?.product?.name || '—' }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400">{{ m.variant?.size }} / {{ m.variant?.color }} ({{ m.variant?.sku }})</td>
              <td class="px-3 sm:px-4 py-3 text-right">
                <span :class="m.quantity_change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-semibold">
                  {{ m.quantity_change > 0 ? '+' : '' }}{{ m.quantity_change }}
                </span>
              </td>
              <td class="px-3 sm:px-4 py-3">
                <Badge :variant="reasonBadge(m.reason) as any">{{ reasonLabel(m.reason) }}</Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <p v-if="!loading && movements.length === 0" class="text-sm text-zinc-400 py-8 text-center">{{ t('validation.no_movements') }}</p>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

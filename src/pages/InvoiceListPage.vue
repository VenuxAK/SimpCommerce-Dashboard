<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import api from '../lib/axios'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import { useNotify } from '../lib/notify'
import Pagination from '../components/Pagination.vue'
import type { Invoice } from '../types'

const { t } = useI18n()
const router = useRouter()
const { error } = useNotify()
const invoices = ref<Invoice[]>([])
const meta = ref<any>(null)
const dateFrom = ref('')
const dateTo = ref('')
const statusFilter = ref('')
const loading = ref(true)

async function loadPage(page = 1) {
  loading.value = true
  try {
    const params: Record<string, string> = { page: String(page) }
    if (dateFrom.value) params.date_from = dateFrom.value
    if (dateTo.value) params.date_to = dateTo.value
    if (statusFilter.value) params.status = statusFilter.value
    const { data } = await api.get('/invoices', { params })
    invoices.value = data.data
    meta.value = { current_page: data.meta.current_page, last_page: data.meta.last_page, total: data.meta.total, per_page: data.meta.per_page }
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage())

async function filter() {
  await loadPage(1)
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    issued: t('invoices.status_issued'),
    paid: t('invoices.status_paid'),
    cancelled: t('invoices.status_cancelled'),
    refunded: t('invoices.status_refunded'),
    draft: t('invoices.status_draft'),
  }
  return map[s] || s
}

const statusBadgeVariant = (s: string) => {
  const map: Record<string, string> = { issued: 'default', paid: 'success', cancelled: 'destructive', refunded: 'secondary', draft: 'warning' }
  return map[s] || 'default'
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('invoices.title') }}</h1>

    <div class="flex flex-wrap gap-2">
      <Input v-model="dateFrom" type="date" class="w-36 sm:w-40" />
      <Input v-model="dateTo" type="date" class="w-36 sm:w-40" />
      <select v-model="statusFilter" @change="filter"
        class="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 flex-1 sm:flex-initial">
        <option value="">{{ t('common.all') }}</option>
        <option value="issued">{{ t('invoices.status_issued') }}</option>
        <option value="paid">{{ t('invoices.status_paid') }}</option>
        <option value="cancelled">{{ t('invoices.status_cancelled') }}</option>
        <option value="refunded">{{ t('invoices.status_refunded') }}</option>
      </select>
    </div>

    <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

    <p v-else-if="!loading && invoices.length === 0" class="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">{{ t('common.no_data') }}</p>

    <Card v-else-if="invoices.length">
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('invoices.invoice_number') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden sm:table-cell">{{ t('sales.order_number') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('invoices.issued_date') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.status') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.total') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in invoices" :key="inv.id"
              class="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
              @click="router.push('/invoices/' + inv.id)"
            >
              <td class="px-3 sm:px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{{ inv.invoice_number }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap hidden sm:table-cell">{{ inv.order?.order_number }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{{ inv.issued_date }}</td>
              <td class="px-3 sm:px-4 py-3">
                <Badge :variant="statusBadgeVariant(inv.status) as any">{{ statusLabel(inv.status) }}</Badge>
              </td>
              <td class="px-3 sm:px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{{ inv.order?.total_amount.toLocaleString() }} Ks</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

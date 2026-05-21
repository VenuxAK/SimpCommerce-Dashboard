<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import { Badge } from '../components/ui/badge'
import { useNotify } from '../lib/notify'
import type { SalesReport } from '../types'

const { t } = useI18n()
const { error } = useNotify()
const dateFrom = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const dateTo = ref(new Date().toISOString().split('T')[0])
const report = ref<SalesReport | null>(null)
const bestSellers = ref<any[] | null>(null)
const paymentMethods = ref<any[] | null>(null)
const loading = ref(false)

async function loadReport() {
  loading.value = true
  try {
    const [salesRes, bestRes, payRes] = await Promise.all([
      api.get('/reports/sales', { params: { date_from: dateFrom.value, date_to: dateTo.value } }),
      api.get('/reports/best-sellers', { params: { date_from: dateFrom.value, date_to: dateTo.value, limit: 20 } }),
      api.get('/reports/payment-methods', { params: { date_from: dateFrom.value, date_to: dateTo.value } }),
    ])
    report.value = salesRes.data
    bestSellers.value = bestRes.data.data
    paymentMethods.value = payRes.data.data
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('reports.title') }}</h1>

    <div class="flex flex-wrap items-end gap-2">
      <div class="space-y-1">
        <label class="text-xs text-zinc-400 dark:text-zinc-500">{{ t('reports.date_from') }}</label>
        <Input v-model="dateFrom" type="date" class="w-36 sm:w-40" />
      </div>
      <div class="space-y-1">
        <label class="text-xs text-zinc-400 dark:text-zinc-500">{{ t('reports.date_to') }}</label>
        <Input v-model="dateTo" type="date" class="w-36 sm:w-40" />
      </div>
      <Button @click="loadReport">{{ t('common.filter') }}</Button>
    </div>

    <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

    <div v-if="report" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader><CardTitle class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('reports.total_sales') }}</CardTitle></CardHeader>
        <CardContent><div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ report.total_sales.toLocaleString() }} Ks</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('reports.order_count') }}</CardTitle></CardHeader>
        <CardContent><div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ report.order_count }}</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('reports.avg_order') }}</CardTitle></CardHeader>
        <CardContent><div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ report.average_order_value.toLocaleString() }} Ks</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle class="text-sm text-zinc-500 dark:text-zinc-400">{{ t('reports.items_sold') }}</CardTitle></CardHeader>
        <CardContent><div class="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ report.items_sold }}</div></CardContent>
      </Card>
    </div>

    <Card v-if="report?.daily_breakdown?.length">
      <CardHeader><CardTitle class="text-zinc-900 dark:text-zinc-100">{{ t('reports.daily') }}</CardTitle></CardHeader>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.date') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('reports.order_count') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('reports.total_sales') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in report.daily_breakdown" :key="day.date" class="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <td class="px-3 sm:px-4 py-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{{ day.date }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{{ day.count }}</td>
              <td class="px-3 sm:px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{{ day.total.toLocaleString() }} Ks</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <Card v-if="bestSellers?.length">
      <CardHeader><CardTitle class="text-zinc-900 dark:text-zinc-100">{{ t('validation.best_sellers') }}</CardTitle></CardHeader>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">#</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('products.product_name') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden sm:table-cell">{{ t('products.variant') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('validation.sold_qty') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('validation.revenue') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in bestSellers" :key="item.product_variant_id" class="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
              <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400">{{ i + 1 }}</td>
              <td class="px-3 sm:px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-40">{{ item.product_name }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden sm:table-cell">{{ item.size }} / {{ item.color }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 font-semibold">{{ item.total_qty }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{{ item.total_revenue.toLocaleString() }} Ks</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <Card v-if="paymentMethods?.length">
      <CardHeader><CardTitle class="text-zinc-900 dark:text-zinc-100">Payment Methods</CardTitle></CardHeader>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left text-zinc-500 dark:text-zinc-400 font-medium">Method</th>
              <th class="px-3 sm:px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 font-medium">Orders</th>
              <th class="px-3 sm:px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pm in paymentMethods" :key="pm.method" class="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <td class="px-3 sm:px-4 py-3 capitalize text-zinc-700 dark:text-zinc-300">{{ pm.method }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{{ pm.count }}</td>
              <td class="px-3 sm:px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">{{ pm.total.toLocaleString() }} Ks</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  </div>
</template>

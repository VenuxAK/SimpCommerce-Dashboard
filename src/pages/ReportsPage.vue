<template>
 <div class="space-y-8 animate-in fade-in duration-500">
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
   <div>
    <h1 class="text-3xl font-semibold tracking-tight text-foreground">{{ t('reports.title') }}</h1>
    <p class="text-sm text-muted-foreground mt-1">Analyze your business performance and sales data</p>
   </div>
  </div>

  <Card class="border-border shadow-sm rounded-2xl overflow-hidden bg-card">
   <CardContent class="p-5">
    <div class="flex flex-wrap items-end gap-4">
     <div class="space-y-1.5 flex-1 min-w-[160px]">
      <label class="text-[10px] font-semibold text-muted-foreground tracking-wider ml-1">{{ t('reports.date_from') }}</label>
      <Input v-model="dateFrom" type="date" class="h-10 rounded-xl border-border focus-visible:ring-primary/20 text-xs font-semibold" />
     </div>
     <div class="space-y-1.5 flex-1 min-w-[160px]">
      <label class="text-[10px] font-semibold text-muted-foreground tracking-wider ml-1">{{ t('reports.date_to') }}</label>
      <Input v-model="dateTo" type="date" class="h-10 rounded-xl border-border focus-visible:ring-primary/20 text-xs font-semibold" />
     </div>
     <Button @click="loadReport" class="h-10 px-8 rounded-xl font-semibold text-[10px] tracking-wider shadow-xl shadow-primary/10">{{ t('common.filter').toUpperCase() }}</Button>
    </div>
   </CardContent>
  </Card>

  <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
   <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>

  <div v-if="report && !loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in slide-in-from-bottom-4 duration-500">
   <Card class="border-none bg-primary text-primary-foreground shadow-xl shadow-primary/10 rounded-2xl">
    <CardHeader class="pb-2"><CardTitle class="text-[10px] font-semibold tracking-wider opacity-70">{{ t('reports.total_sales') }}</CardTitle></CardHeader>
    <CardContent><div class="text-3xl font-semibold tracking-tight tabular-nums">{{ report.total_sales.toLocaleString() }} Ks</div></CardContent>
   </Card>
   <Card class="border-border shadow-sm rounded-2xl">
    <CardHeader class="pb-2"><CardTitle class="text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('reports.order_count') }}</CardTitle></CardHeader>
    <CardContent><div class="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{{ report.order_count }}</div></CardContent>
   </Card>
   <Card class="border-border shadow-sm rounded-2xl">
    <CardHeader class="pb-2"><CardTitle class="text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('reports.avg_order') }}</CardTitle></CardHeader>
    <CardContent><div class="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{{ report.average_order_value.toLocaleString() }} Ks</div></CardContent>
   </Card>
   <Card class="border-border shadow-sm rounded-2xl">
    <CardHeader class="pb-2"><CardTitle class="text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('reports.items_sold') }}</CardTitle></CardHeader>
    <CardContent><div class="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{{ report.items_sold }}</div></CardContent>
   </Card>
  </div>

  <div v-if="report && !loading" class="grid gap-6 lg:grid-cols-2">
   <Card class="border-border shadow-sm rounded-2xl overflow-hidden">
    <CardHeader class="border-b bg-muted/30 py-4 px-6"><CardTitle class="text-[10px] font-semibold text-foreground tracking-wider">{{ t('reports.daily') }}</CardTitle></CardHeader>
    <CardContent class="p-0 overflow-x-auto">
     <table class="w-full text-left border-collapse">
      <thead>
       <tr class="border-b bg-muted/20">
        <th class="px-6 py-4 text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('common.date') }}</th>
        <th class="px-6 py-4 text-right text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('reports.order_count') }}</th>
        <th class="px-6 py-4 text-right text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('reports.total_sales') }}</th>
       </tr>
      </thead>
      <tbody class="divide-y divide-border/40">
       <tr v-for="day in report.daily_breakdown" :key="day.date" class="hover:bg-muted/30 transition-colors group">
        <td class="px-6 py-4 text-xs font-semibold text-muted-foreground tracking-tight">{{ day.date }}</td>
        <td class="px-6 py-4 text-right text-sm font-semibold text-foreground tabular-nums">{{ day.count }}</td>
        <td class="px-6 py-4 text-right text-sm font-semibold text-primary tabular-nums">{{ day.total.toLocaleString() }} Ks</td>
       </tr>
      </tbody>
     </table>
    </CardContent>
   </Card>

   <Card class="border-border shadow-sm rounded-2xl overflow-hidden">
    <CardHeader class="border-b bg-muted/30 py-4 px-6"><CardTitle class="text-[10px] font-semibold text-foreground tracking-wider">{{ t('validation.best_sellers') }}</CardTitle></CardHeader>
    <CardContent class="p-0 overflow-x-auto">
     <table class="w-full text-left border-collapse">
      <thead>
       <tr class="border-b bg-muted/20">
        <th class="px-6 py-4 text-[10px] font-semibold tracking-wider text-muted-foreground">RANK</th>
        <th class="px-6 py-4 text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('products.product_name') }}</th>
        <th class="px-6 py-4 text-right text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('validation.sold_qty') }}</th>
        <th class="px-6 py-4 text-right text-[10px] font-semibold tracking-wider text-muted-foreground">{{ t('validation.revenue') }}</th>
       </tr>
      </thead>
      <tbody class="divide-y divide-border/40">
       <tr v-for="(item, i) in bestSellers" :key="item.product_variant_id" class="hover:bg-muted/30 transition-colors group">
        <td class="px-6 py-4 text-xs font-semibold text-muted-foreground tabular-nums">#{{ i + 1 }}</td>
        <td class="px-6 py-4 min-w-[200px]">
         <p class="text-sm font-semibold text-foreground tracking-tight truncate group-hover:text-primary transition-colors">{{ item.product_name }}</p>
         <p class="text-[9px] font-semibold text-muted-foreground tracking-tight mt-0.5">{{ item.size }} / {{ item.color }}</p>
        </td>
        <td class="px-6 py-4 text-right text-sm font-semibold text-foreground tabular-nums">{{ item.total_qty }}</td>
        <td class="px-6 py-4 text-right text-sm font-semibold text-primary tabular-nums">{{ item.total_revenue.toLocaleString() }} Ks</td>
       </tr>
      </tbody>
     </table>
    </CardContent>
   </Card>
  </div>

  <Card v-if="paymentMethods?.length && !loading" class="max-w-xl border-border shadow-sm rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
   <CardHeader class="border-b bg-muted/30 py-4 px-6"><CardTitle class="text-[10px] font-semibold text-foreground tracking-wider">Payment Methods</CardTitle></CardHeader>
   <CardContent class="p-0 overflow-x-auto">
    <table class="w-full text-left border-collapse">
     <thead>
      <tr class="border-b bg-muted/20">
       <th class="px-6 py-4 text-[10px] font-semibold tracking-wider text-muted-foreground">METHOD</th>
       <th class="px-6 py-4 text-right text-[10px] font-semibold tracking-wider text-muted-foreground">ORDERS</th>
       <th class="px-6 py-4 text-right text-[10px] font-semibold tracking-wider text-muted-foreground">REVENUE</th>
      </tr>
     </thead>
     <tbody class="divide-y divide-border/40">
      <tr v-for="pm in paymentMethods" :key="pm.method" class="hover:bg-muted/30 transition-colors group">
       <td class="px-6 py-4">
        <div class="flex items-center gap-3">
         <div class="size-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
          <Wallet v-if="pm.method === 'cash'" class="size-4" />
          <CreditCard v-else class="size-4" />
         </div>
         <span class="text-xs font-semibold text-foreground tracking-wider">{{ pm.method }}</span>
        </div>
       </td>
       <td class="px-6 py-4 text-right text-sm font-semibold text-foreground tabular-nums">{{ pm.count }}</td>
       <td class="px-6 py-4 text-right text-sm font-semibold text-primary tabular-nums">{{ pm.total.toLocaleString() }} Ks</td>
      </tr>
     </tbody>
    </table>
   </CardContent>
  </Card>
 </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import { Wallet, CreditCard } from 'lucide-vue-next'
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

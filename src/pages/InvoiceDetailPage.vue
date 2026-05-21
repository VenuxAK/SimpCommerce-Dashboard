<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Printer, FileDown, Receipt } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useNotify } from '../lib/notify'
import type { Invoice } from '../types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { error } = useNotify()
const invoice = ref<Invoice | null>(null)
const shopInfo = ref({ shop_name: '', shop_address: '', shop_phone: '' })
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await api.get(`/invoices/${route.params.id}`)
    invoice.value = data.data
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
})

function statusBadgeVariant(s: string) {
  const map: Record<string, string> = { issued: 'default', paid: 'success', cancelled: 'destructive', refunded: 'secondary', draft: 'warning' }
  return map[s] || 'default'
}

function printInvoice() {
  window.print()
}

async function openReceipt() {
  try {
    const response = await api.get(`/invoices/${route.params.id}/receipt`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  } catch {}
}

async function downloadPdf() {
  try {
    const response = await api.get(`/invoices/${route.params.id}/pdf`, {
      responseType: 'blob',
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoice.value?.invoice_number || route.params.id}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
}
</script>

<template>
  <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

  <div v-else-if="!invoice" class="py-12 text-center text-zinc-400 dark:text-zinc-500">
    <p>{{ t('common.no_data') }}</p>
    <Button variant="outline" class="mt-4" @click="router.back()">{{ t('common.back') }}</Button>
  </div>

  <div v-else class="space-y-6">
    <div class="flex items-center justify-between no-print gap-2 flex-wrap">
      <Button variant="outline" @click="router.back()">{{ t('common.back') }}</Button>
      <div class="flex gap-2">
        <Button variant="outline" @click="openReceipt"><Receipt class="size-4" /> Receipt</Button>
        <Button variant="outline" @click="printInvoice"><Printer class="size-4" /> {{ t('invoices.print') }}</Button>
        <Button @click="downloadPdf"><FileDown class="size-4" /> PDF</Button>
      </div>
    </div>

    <Card id="invoice-print" class="mx-auto max-w-2xl">
      <CardContent class="p-4 sm:p-8 space-y-6">
        <div class="text-center border-b border-zinc-200 dark:border-zinc-700 pb-4">
          <h2 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ shopInfo.shop_name || t('app') }}</h2>
          <p class="text-sm text-zinc-400 dark:text-zinc-500">{{ shopInfo.shop_address }}</p>
          <p class="text-sm text-zinc-400 dark:text-zinc-500">{{ shopInfo.shop_phone }}</p>
        </div>

        <div class="flex flex-col sm:flex-row justify-between gap-2 text-sm">
          <div class="text-zinc-700 dark:text-zinc-300">
            <p><span class="font-semibold text-zinc-900 dark:text-zinc-100">{{ t('invoices.invoice_number') }}:</span> {{ invoice.invoice_number }}</p>
            <p><span class="font-semibold text-zinc-900 dark:text-zinc-100">{{ t('invoices.issued_date') }}:</span> {{ invoice.issued_date }}</p>
            <p v-if="invoice.due_date"><span class="font-semibold text-zinc-900 dark:text-zinc-100">{{ t('invoices.due_date') }}:</span> {{ invoice.due_date }}</p>
          </div>
          <div class="sm:text-right">
            <Badge :variant="statusBadgeVariant(invoice.status) as any">{{ invoice.status }}</Badge>
          </div>
        </div>

        <div v-if="invoice.order" class="space-y-2">
          <p class="font-semibold text-zinc-900 dark:text-zinc-100">{{ t('sales.order_number') }}: {{ invoice.order.order_number }}</p>
          <p v-if="invoice.order.customer" class="text-sm text-zinc-700 dark:text-zinc-300">
            {{ t('sales.customer') }}: {{ invoice.order.customer.name }}
          </p>

          <div class="overflow-x-auto">
            <table class="w-full text-sm mt-4">
              <thead class="border-y border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th class="px-2 sm:px-3 py-2 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.items') }}</th>
                  <th class="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.qty') }}</th>
                  <th class="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('products.base_price') }}</th>
                  <th class="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.subtotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in invoice.order.items" :key="item.id" class="border-b border-zinc-100 dark:border-zinc-800">
                  <td class="px-2 sm:px-3 py-2 text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{{ item.variant?.product?.name }} ({{ item.variant?.size }}/{{ item.variant?.color }})</td>
                  <td class="px-2 sm:px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">{{ item.quantity }}</td>
                  <td class="px-2 sm:px-3 py-2 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{{ item.unit_price.toLocaleString() }}</td>
                  <td class="px-2 sm:px-3 py-2 text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{{ item.subtotal.toLocaleString() }} Ks</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="text-right text-xl font-bold text-zinc-900 dark:text-zinc-100 pt-2">
            {{ t('common.total') }}: {{ invoice.order.total_amount.toLocaleString() }} Ks
          </div>
        </div>

        <div v-if="invoice.terms" class="border-t border-zinc-200 dark:border-zinc-700 pt-4 text-xs text-zinc-400 dark:text-zinc-500">
          {{ invoice.terms }}
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
@media print {
  .no-print { display: none; }
  #invoice-print { box-shadow: none; border: none; background: white !important; }
}
</style>

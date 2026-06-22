<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Printer, FileDown, Receipt } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { useNotify } from '../../lib/notify'
import { useInvoiceApi } from '../../composables/api'
import type { Invoice } from '../../types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { error } = useNotify()
const invoiceApi = useInvoiceApi()
const invoice = ref<Invoice | null>(null)
const shopInfo = ref({ shop_name: '', shop_address: '', shop_phone: '' })
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await invoiceApi.get(Number(route.params.id))
    invoice.value = data.data
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
})

const statusBadgeVariant = (s: string) => ({
  issued: 'default', paid: 'success', cancelled: 'destructive', refunded: 'secondary', draft: 'warning',
}[s] || 'default')

const printInvoice = () => window.print()

const openReceipt = async () => {
  try {
    const response = await invoiceApi.receipt(Number(route.params.id))
    const blob = new Blob([response.data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  } catch {}
}

const downloadPdf = async () => {
  try {
    const response = await invoiceApi.pdf(Number(route.params.id))
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
  <LoadingSpinner v-if="loading" />
  <div v-else-if="!invoice" class="py-12 text-center text-muted-foreground">
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
        <div class="text-center border-b border-border pb-4">
          <h2 class="text-xl sm:text-2xl font-bold text-foreground">{{ shopInfo.shop_name || t('app') }}</h2>
          <p class="text-sm text-muted-foreground">{{ shopInfo.shop_address }}</p>
          <p class="text-sm text-muted-foreground">{{ shopInfo.shop_phone }}</p>
        </div>
        <div class="flex flex-col sm:flex-row justify-between gap-2 text-sm">
          <div class="text-foreground/80">
            <p><span class="font-semibold text-foreground">{{ t('invoices.invoice_number') }}:</span> {{ invoice.invoice_number }}</p>
            <p><span class="font-semibold text-foreground">{{ t('invoices.issued_date') }}:</span> {{ invoice.issued_date }}</p>
            <p v-if="invoice.due_date"><span class="font-semibold text-foreground">{{ t('invoices.due_date') }}:</span> {{ invoice.due_date }}</p>
          </div>
          <div class="sm:text-right">
            <Badge :variant="statusBadgeVariant(invoice.status) as any">{{ invoice.status }}</Badge>
          </div>
        </div>
        <div v-if="invoice.order" class="space-y-2">
          <p class="font-semibold text-foreground">{{ t('sales.order_number') }}: {{ invoice.order.order_number }}</p>
          <p v-if="invoice.order.customer" class="text-sm text-foreground/80">{{ t('sales.customer') }}: {{ invoice.order.customer.name }}</p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm mt-4">
              <thead class="border-y border-border bg-muted/30">
                <tr>
                  <th class="px-2 sm:px-3 py-2 text-left whitespace-nowrap text-muted-foreground font-medium">{{ t('common.items') }}</th>
                  <th class="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-muted-foreground font-medium">{{ t('common.qty') }}</th>
                  <th class="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-muted-foreground font-medium">{{ t('products.base_price') }}</th>
                  <th class="px-2 sm:px-3 py-2 text-right whitespace-nowrap text-muted-foreground font-medium">{{ t('common.subtotal') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in invoice.order.items" :key="item.id" class="border-b border-border/60">
                  <td class="px-2 sm:px-3 py-2 text-foreground whitespace-nowrap">{{ item.variant?.product?.name }} ({{ item.variant?.size }}/{{ item.variant?.color }})</td>
                  <td class="px-2 sm:px-3 py-2 text-right text-foreground/80">{{ item.quantity }}</td>
                  <td class="px-2 sm:px-3 py-2 text-right text-foreground/80 whitespace-nowrap">{{ item.unit_price.toLocaleString() }}</td>
                  <td class="px-2 sm:px-3 py-2 text-right font-semibold text-foreground whitespace-nowrap">{{ item.subtotal.toLocaleString() }} Ks</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="text-right text-xl font-bold text-foreground pt-2">{{ t('common.total') }}: {{ invoice.order.total_amount.toLocaleString() }} Ks</div>
        </div>
        <div v-if="invoice.terms" class="border-t border-border pt-4 text-xs text-muted-foreground">{{ invoice.terms }}</div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
@media print { .no-print { display: none; } #invoice-print { box-shadow: none; border: none; background: white !important; } }
</style>

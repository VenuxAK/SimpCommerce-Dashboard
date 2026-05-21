<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { RotateCcw } from 'lucide-vue-next'
import { useNotify } from '../lib/notify'
import type { Order } from '../types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { success, error } = useNotify()
const order = ref<Order | null>(null)
const loading = ref(true)
const refunding = ref(false)
const showReturnPanel = ref(false)
const returnItems = ref<Record<number, { checked: boolean; quantity: number; reason: string }>>({})

onMounted(async () => {
  try {
    const { data } = await api.get(`/orders/${route.params.id}`)
    order.value = data.data
    initReturnItems()
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
})

function initReturnItems() {
  returnItems.value = {}
  order.value?.items.forEach((item) => {
    returnItems.value[item.id] = { checked: false, quantity: item.quantity, reason: '' }
  })
}

function toggleReturnPanel() {
  showReturnPanel.value = !showReturnPanel.value
  if (showReturnPanel.value) initReturnItems()
}

const hasSelectedReturns = computed(() =>
  Object.values(returnItems.value).some((r) => r.checked),
)

async function submitReturn() {
  const items = Object.entries(returnItems.value)
    .filter(([, v]) => v.checked)
    .map(([id, v]) => ({
      order_item_id: Number(id),
      quantity: v.quantity,
      reason: v.reason || 'Customer return',
    }))

  if (items.length === 0) return

  refunding.value = true
  try {
    const res = await api.post(`/orders/${route.params.id}/return`, { items })
    success(t('validation.refund_success'))
    order.value = res.data.order
    showReturnPanel.value = false
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  } finally {
    refunding.value = false
  }
}

function statusBadge(status: string) {
  const map: Record<string, string> = { completed: 'success', pending: 'warning', cancelled: 'destructive', refunded: 'secondary' }
  return map[status] || 'default'
}
</script>

<template>
  <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

  <div v-else-if="!order" class="py-12 text-center text-zinc-400 dark:text-zinc-500">
    <p>{{ t('common.no_data') }}</p>
    <Button variant="outline" class="mt-4" @click="router.back()">{{ t('common.back') }}</Button>
  </div>

  <div v-else class="space-y-6">
    <Button variant="outline" @click="router.back()">{{ t('common.back') }}</Button>

    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ order.order_number }}</h1>
        <p class="text-sm text-zinc-400 dark:text-zinc-500">{{ order.created_at }}</p>
      </div>
      <Badge :variant="statusBadge(order.status) as any" class="text-sm px-4 py-1 w-fit">{{ order.status }}</Badge>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader><CardTitle class="text-zinc-900 dark:text-zinc-100">{{ t('sales.customer') }}</CardTitle></CardHeader>
        <CardContent>
          <p v-if="order.customer" class="text-zinc-700 dark:text-zinc-300">{{ order.customer.name }}<br>
            <span class="text-xs text-zinc-400 dark:text-zinc-500">{{ order.customer.phone }}</span></p>
          <p v-else class="text-sm text-zinc-400 dark:text-zinc-500">—</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle class="text-zinc-900 dark:text-zinc-100">{{ t('pos.payment') }}</CardTitle></CardHeader>
        <CardContent>
          <p class="text-sm text-zinc-700 dark:text-zinc-300" v-if="order.payment">
            {{ order.payment.method }} · {{ order.payment.amount.toLocaleString() }} Ks
          </p>
          <p v-else class="text-sm text-zinc-400 dark:text-zinc-500">—</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle class="text-zinc-900 dark:text-zinc-100">{{ t('sales.items') }} ({{ order.items.length }})</CardTitle>
        <Button v-if="['completed', 'refunded'].includes(order.status)" variant="outline" size="sm" @click="toggleReturnPanel">
          <RotateCcw class="size-4" /> {{ t('common.refund') }}
        </Button>
      </CardHeader>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th v-if="showReturnPanel" class="px-3 py-3 w-10"></th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('sales.items') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden sm:table-cell">{{ t('common.variant') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden md:table-cell">{{ t('products.sku') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.qty') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('products.base_price') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('common.subtotal') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.items" :key="item.id" class="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              :class="showReturnPanel && returnItems[item.id]?.checked ? 'bg-amber-50 dark:bg-amber-900/10' : ''">
              <td v-if="showReturnPanel" class="px-3 py-3">
                <input type="checkbox" v-model="returnItems[item.id].checked" class="rounded" />
              </td>
              <td class="px-3 sm:px-4 py-3 text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{{ item.variant?.product?.name || '—' }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap hidden sm:table-cell">{{ item.variant?.size }} / {{ item.variant?.color }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{{ item.variant?.sku }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{{ item.quantity }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{{ item.unit_price.toLocaleString() }}</td>
              <td class="px-3 sm:px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{{ item.subtotal.toLocaleString() }} Ks</td>
            </tr>
            <tr v-if="showReturnPanel && hasSelectedReturns">
              <td :colspan="showReturnPanel ? 7 : 6" class="px-4 py-3">
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <span class="text-sm text-zinc-500 whitespace-nowrap">Returning selected items</span>
                  <Button size="sm" variant="destructive" :disabled="refunding" @click="submitReturn">
                    {{ refunding ? t('common.loading') : t('common.refund') }}
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <div class="flex items-center justify-between">
      <div class="text-right text-xl font-bold text-zinc-900 dark:text-zinc-100">
        {{ t('common.total') }}: {{ order.total_amount.toLocaleString() }} Ks
      </div>
    </div>
  </div>
</template>

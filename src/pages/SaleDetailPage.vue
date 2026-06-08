<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import { RotateCcw, ChevronLeft, Wallet, CreditCard, Check, Package, Truck, XCircle, MapPin } from 'lucide-vue-next'
import { useNotify } from '../lib/notify'
import { useOrderApi } from '../composables/api'
import type { Order } from '../types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { success, error } = useNotify()
const orderApi = useOrderApi()
const order = ref<Order | null>(null)
const loading = ref(true)
const refunding = ref(false)
const showReturnPanel = ref(false)
const returnItems = ref<Record<number, { checked: boolean; quantity: number; reason: string }>>({})

const showTrackingModal = ref(false)
const trackingNumber = ref('')
const statusUpdating = ref(false)

onMounted(async () => {
  try {
    const { data } = await orderApi.get(Number(route.params.id))
    order.value = data.data
    initReturnItems()
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
})

const initReturnItems = () => {
  returnItems.value = {}
  order.value?.items.forEach((item) => {
    returnItems.value[item.id] = { checked: false, quantity: item.quantity, reason: '' }
  })
}

const toggleReturnPanel = () => {
  showReturnPanel.value = !showReturnPanel.value
  if (showReturnPanel.value) initReturnItems()
}

const hasSelectedReturns = computed(() =>
  Object.values(returnItems.value).some((r) => r.checked),
)

const submitReturn = async () => {
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
    const res = await orderApi.returnItems(Number(route.params.id), items)
    success(t('validation.refund_success'))
    order.value = res.data.order
    showReturnPanel.value = false
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  } finally {
    refunding.value = false
  }
}

const updateOrderStatus = async (newStatus: string) => {
  statusUpdating.value = true
  try {
    const body: any = { status: newStatus }
    if (newStatus === 'shipped' && trackingNumber.value) {
      body.tracking_number = trackingNumber.value
    }
    const res = await orderApi.updateStatus(Number(route.params.id), newStatus, trackingNumber.value || undefined)
    order.value = res.data.data
    showTrackingModal.value = false
    trackingNumber.value = ''
    success(`Order marked as ${newStatus}`)
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  } finally {
    statusUpdating.value = false
  }
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    completed: 'success',
    pending: 'warning',
    processing: 'warning',
    shipped: 'default',
    delivered: 'success',
    cancelled: 'destructive',
    refunded: 'secondary',
  }
  return map[status] || 'default'
}

const shipment = computed(() => order.value?.shipment)
</script>

<template>
  <div>
    <div v-if="loading" class="flex h-96 items-center justify-center text-muted-foreground">
    <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>

  <div v-else-if="!order" class="py-24 text-center animate-in fade-in duration-500">
    <p class="text-sm font-medium text-muted-foreground">{{ t('common.no_data') }}</p>
    <Button variant="outline" class="mt-6" @click="router.back()">{{ t('common.back') }}</Button>
  </div>

  <div v-else class="space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="router.back()" class="size-8">
          <ChevronLeft class="size-4" />
        </Button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ order.order_number }}</h1>
            <Badge v-if="order.source === 'online'" variant="default" class="h-5 px-2 text-[10px]">ONLINE</Badge>
            <Badge v-else variant="outline" class="h-5 px-2 text-[10px]">POS</Badge>
          </div>
          <p class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">{{ order.created_at }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Badge :variant="statusBadge(order.status) as any" class="h-6 px-3 text-[10px] font-medium uppercase tracking-wider">{{ order.status }}</Badge>
        <!-- Mark Shipped -->
        <Button v-if="order.status === 'processing' && order.source === 'online'" size="sm" @click="showTrackingModal = true" class="h-8 text-[10px]">
          <Truck class="size-3 mr-1.5" /> Mark Shipped
        </Button>
        <!-- Mark Delivered -->
        <Button v-if="order.status === 'shipped' && order.source === 'online'" size="sm" @click="updateOrderStatus('delivered')" :disabled="statusUpdating" class="h-8 text-[10px]">
          <Check class="size-3 mr-1.5" /> Mark Delivered
        </Button>
      </div>
    </div>

    <!-- Customer + Payment Cards -->
    <div class="grid gap-6 md:grid-cols-2">
      <Card class="shadow-none">
        <CardHeader class="border-b bg-muted/10 py-3 px-5">
          <CardTitle class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{{ t('sales.customer') }}</CardTitle>
        </CardHeader>
        <CardContent class="p-5">
          <div v-if="order.customer" class="flex items-center gap-4">
            <div class="size-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-xs border shadow-sm">
              {{ order.customer.name.charAt(0) }}
            </div>
            <div>
              <p class="text-sm font-semibold text-foreground">{{ order.customer.name }}</p>
              <p class="text-[11px] font-medium text-muted-foreground mt-0.5">{{ order.customer.phone || 'NO PHONE' }}</p>
            </div>
          </div>
          <p v-else class="text-[11px] font-medium text-muted-foreground uppercase tracking-widest text-center py-2">— NO CUSTOMER —</p>
        </CardContent>
      </Card>

      <Card class="shadow-none">
        <CardHeader class="border-b bg-muted/10 py-3 px-5">
          <CardTitle class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{{ t('pos.payment') }}</CardTitle>
        </CardHeader>
        <CardContent class="p-5">
          <div v-if="order.payment" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-md bg-secondary flex items-center justify-center text-muted-foreground border">
                <Wallet v-if="order.payment.method === 'cash'" class="size-4" />
                <CreditCard v-else class="size-4" />
              </div>
              <div>
                <p class="text-xs font-semibold text-foreground uppercase tracking-wider">{{ order.payment.method }}</p>
                <p class="text-[10px] font-medium text-muted-foreground mt-0.5">COMPLETED</p>
              </div>
            </div>
            <p class="text-xl font-bold text-foreground tabular-nums">{{ order.payment.amount.toLocaleString() }} Ks</p>
          </div>
          <p v-else class="text-[11px] font-medium text-muted-foreground uppercase tracking-widest text-center py-2">— CASH ON DELIVERY —</p>
        </CardContent>
      </Card>
    </div>

    <!-- Shipment Card (online orders) -->
    <Card v-if="shipment" class="shadow-none">
      <CardHeader class="border-b bg-muted/10 py-3 px-5">
        <CardTitle class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Shipment</CardTitle>
      </CardHeader>
      <CardContent class="p-5 space-y-4">
        <div v-if="shipment.address" class="flex items-start gap-3">
          <MapPin class="size-4 text-muted-foreground mt-0.5 shrink-0" />
          <div class="text-xs text-foreground space-y-1">
            <p class="font-medium">{{ shipment.address.name }}</p>
            <p class="text-muted-foreground">{{ shipment.address.phone }}</p>
            <p class="text-muted-foreground">{{ shipment.address.street }}, {{ shipment.address.city }}, {{ shipment.address.state }} {{ shipment.address.postal_code }}</p>
          </div>
        </div>
        <div class="flex gap-6 text-xs">
          <div>
            <span class="text-muted-foreground">Method:</span> {{ shipment.method }}
          </div>
          <div v-if="shipment.tracking_number">
            <span class="text-muted-foreground">Tracking:</span> {{ shipment.tracking_number }}
          </div>
        </div>
        <!-- Timeline -->
        <div class="flex items-center gap-6 pt-2 border-t border-border/60">
          <div class="flex items-center gap-2">
            <div class="size-6 rounded-full bg-success/10 flex items-center justify-center"><Check class="size-3 text-success" /></div>
            <span class="text-[10px] font-medium text-foreground">Ordered</span>
          </div>
          <div class="h-px w-6 bg-border" />
          <div class="flex items-center gap-2">
            <div :class="['size-6 rounded-full flex items-center justify-center', shipment.shipped_at ? 'bg-success/10' : 'bg-muted']">
              <Truck :class="['size-3', shipment.shipped_at ? 'text-success' : 'text-muted-foreground']" />
            </div>
            <span class="text-[10px] font-medium" :class="shipment.shipped_at ? 'text-foreground' : 'text-muted-foreground'">Shipped</span>
          </div>
          <div class="h-px w-6 bg-border" />
          <div class="flex items-center gap-2">
            <div :class="['size-6 rounded-full flex items-center justify-center', shipment.delivered_at ? 'bg-success/10' : 'bg-muted']">
              <Check :class="['size-3', shipment.delivered_at ? 'text-success' : 'text-muted-foreground']" />
            </div>
            <span class="text-[10px] font-medium" :class="shipment.delivered_at ? 'text-foreground' : 'text-muted-foreground'">Delivered</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Items -->
    <Card class="shadow-none overflow-hidden border">
      <CardHeader class="flex flex-row items-center justify-between border-b bg-muted/10 py-3 px-6">
        <CardTitle class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{{ t('sales.items') }} ({{ order.items.length }})</CardTitle>
        <Button v-if="['completed', 'refunded'].includes(order.status)" variant="outline" size="sm" @click="toggleReturnPanel" class="h-7 text-[10px]">
          <RotateCcw class="size-3 mr-1.5" /> {{ t('common.refund') }}
        </Button>
      </CardHeader>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th v-if="showReturnPanel" class="px-6 py-3 w-12 text-center"><Check class="size-3 text-muted-foreground mx-auto" /></th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('sales.items') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{{ t('common.variant') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('common.qty') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('products.base_price') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in order.items" :key="item.id" class="hover:bg-muted/30 transition-colors group"
              :class="showReturnPanel && returnItems[item.id]?.checked ? 'bg-destructive/[0.03]' : ''">
              <td v-if="showReturnPanel" class="px-6 py-4 text-center">
                <input type="checkbox" v-model="returnItems[item.id].checked" class="size-4 rounded border-border text-primary focus:ring-primary/10 cursor-pointer" />
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="size-10 rounded border bg-muted/50 overflow-hidden shrink-0">
                    <img v-if="item.variant?.product?.image_url" :src="item.variant.product.image_url" class="size-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                    <span v-else class="flex size-full items-center justify-center text-sm opacity-20">👕</span>
                  </div>
                  <span class="font-semibold text-foreground">{{ item.variant?.product?.name || '—' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-muted-foreground font-medium hidden sm:table-cell">{{ item.variant?.size }} / {{ item.variant?.color }}</td>
              <td class="px-6 py-4 text-right font-medium tabular-nums">{{ item.quantity }}</td>
              <td class="px-6 py-4 text-right font-medium tabular-nums">{{ item.unit_price.toLocaleString() }}</td>
              <td class="px-6 py-4 text-right font-bold tabular-nums text-foreground">{{ item.subtotal.toLocaleString() }} Ks</td>
            </tr>
            <tr v-if="showReturnPanel && hasSelectedReturns" class="bg-muted/5">
              <td :colspan="showReturnPanel ? 6 : 5" class="px-6 py-6 border-t border-dashed">
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div class="flex items-center gap-3">
                    <div class="size-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                      <RotateCcw class="size-5" />
                    </div>
                    <div>
                      <p class="text-xs font-semibold text-foreground">Processing Refund</p>
                      <p class="text-[10px] text-muted-foreground">Selected items will be restored to inventory</p>
                    </div>
                  </div>
                  <Button size="sm" variant="destructive" :disabled="refunding" @click="submitReturn" class="h-9 px-6 font-semibold shadow-none">
                    {{ refunding ? 'PROCESSING...' : 'CONFIRM REFUND' }}
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <!-- Total -->
    <div class="flex justify-end pt-4">
      <div class="text-right space-y-1">
        <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{{ t('common.total') }}</p>
        <div class="text-4xl font-bold text-foreground tracking-tight tabular-nums">
          {{ order.total_amount.toLocaleString() }} <span class="text-sm font-medium text-muted-foreground ml-1">Ks</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Tracking Number Modal -->
  <Teleport to="body">
    <div v-if="showTrackingModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" @click.self="showTrackingModal = false">
      <div class="w-full max-w-sm rounded-lg border bg-popover p-6 shadow-xl animate-in fade-in zoom-in-95">
        <h3 class="text-sm font-semibold text-foreground mb-2">Mark Order as Shipped</h3>
        <p class="text-xs text-muted-foreground mb-4">Enter tracking number (optional)</p>
        <Input v-model="trackingNumber" placeholder="Tracking number..." class="mb-4" />
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="showTrackingModal = false">Cancel</Button>
          <Button size="sm" :disabled="statusUpdating" @click="updateOrderStatus('shipped')">
            <Truck class="size-3.5 mr-1.5" /> Confirm Shipment
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
  </div>
</template>

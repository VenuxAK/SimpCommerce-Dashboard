<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { useNotify } from '../../lib/notify'
import { useCustomerApi } from '../../composables/api'
import type { Customer, Order } from '../../types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { error } = useNotify()
const customerApi = useCustomerApi()
const customer = ref<Customer | null>(null)
const orders = ref<Order[]>([])
const loading = ref(true)

const customerId = Number(route.params.id)
const isValidId = !Number.isNaN(customerId) && customerId > 0

onMounted(async () => {
  if (!isValidId) {
    loading.value = false
    error('Invalid customer ID.')
    return
  }
  try {
    const [cRes, oRes] = await Promise.all([
      customerApi.get(customerId),
      customerApi.getOrders(customerId),
    ])
    customer.value = cRes.data.data
    orders.value = oRes.data.data
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <LoadingSpinner v-if="loading" />
  <div v-else-if="!customer" class="py-12 text-center text-muted-foreground">
    <p>{{ t('common.no_data') }}</p>
    <Button variant="outline" class="mt-4" @click="router.back()">{{ t('common.back') }}</Button>
  </div>
  <div v-else class="space-y-6">
    <Button variant="outline" @click="router.back()">{{ t('common.back') }}</Button>
    <Card class="max-w-md">
      <CardHeader><CardTitle class="text-foreground">{{ customer.name }}</CardTitle></CardHeader>
      <CardContent class="space-y-2 text-sm">
        <p class="text-foreground/80"><span class="text-muted-foreground">{{ t('customers.email') }}:</span> {{ customer.email || '—' }}</p>
        <p class="text-foreground/80"><span class="text-muted-foreground">{{ t('customers.phone') }}:</span> {{ customer.phone || '—' }}</p>
        <p class="text-foreground/80"><span class="text-muted-foreground">{{ t('customers.address') }}:</span> {{ customer.address || '—' }}</p>
        <p class="text-foreground/80"><span class="text-muted-foreground">{{ t('customers.loyalty_points') }}:</span> {{ customer.loyalty_points }}</p>
      </CardContent>
    </Card>
    <div class="space-y-2">
      <h2 class="font-semibold text-foreground/80">{{ t('customers.order_history') }}</h2>
      <Card v-if="orders.length">
        <CardContent class="p-0 overflow-x-auto">
          <div v-for="order in orders" :key="order.id"
            class="flex items-center justify-between border-b border-border/60 px-4 sm:px-6 py-3 last:border-0 cursor-pointer hover:bg-muted/30 transition-colors"
            @click="router.push(`/store/${route.params.storeSlug}/sales/${order.id}`)">
            <div class="min-w-0">
              <p class="text-sm font-medium text-foreground truncate">{{ order.order_number }}</p>
              <p class="text-xs text-muted-foreground">{{ order.created_at }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <Badge>{{ order.status }}</Badge>
              <span class="font-semibold whitespace-nowrap text-foreground">{{ order.total_amount.toLocaleString() }} Ks</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <p v-else class="text-sm text-muted-foreground">{{ t('customers.no_orders') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Bell, PackageCheck, Truck, CreditCard, RefreshCw, CheckCheck, ExternalLink, Trash2 } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import Select from '../../components/ui/Select.vue'
import Pagination from '../../components/Pagination.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import PageHeader from '../../components/PageHeader.vue'
import { useDebouncedWatch } from '../../composables'
import { useNotificationApi } from '../../composables/api/useNotificationApi'
import type { OrderNotification } from '../../types'

const { t } = useI18n()
const router = useRouter()
const notifApi = useNotificationApi()

const notifications = ref<OrderNotification[]>([])
const meta = ref<any>(null)
const loading = ref(true)

const readFilter = ref('')
const typeFilter = ref('')

async function load(page = 1) {
  loading.value = true
  try {
    const params: Record<string, any> = { page }
    if (readFilter.value) params.read = readFilter.value
    if (typeFilter.value) params.type = typeFilter.value
    const res = await notifApi.list(params)
    notifications.value = res.data?.data ?? []
    meta.value = res.data?.meta ?? null
  } catch {
    notifications.value = []
  } finally {
    loading.value = false
  }
}

useDebouncedWatch([readFilter, typeFilter], () => load(1))

onMounted(() => load(1))

const readOptions = [
  { label: t('common.all'), value: '' },
  { label: t('common.unread'), value: '0' },
  { label: t('common.read'), value: '1' },
]

const typeOptions = [
  { label: t('common.all'), value: '' },
  { label: 'New Order', value: 'new_order' },
  { label: 'Status Change', value: 'status_change' },
  { label: 'Shipment Update', value: 'shipment_update' },
  { label: 'Payment Confirmed', value: 'payment_confirmed' },
]

const typeIcons: Record<string, any> = {
  new_order: PackageCheck,
  status_change: RefreshCw,
  shipment_update: Truck,
  payment_confirmed: CreditCard,
}

const marking = ref(false)
const clearing = ref(false)

async function markRead(item: OrderNotification) {
  if (item.read_at) return
  try {
    await notifApi.markRead(item.id)
    item.read_at = new Date().toISOString()
  } catch {}
}

async function markAllRead() {
  marking.value = true
  try {
    await notifApi.markAllRead()
    notifications.value.forEach((i) => { i.read_at = new Date().toISOString() })
    await load(meta.value?.current_page ?? 1)
  } catch {} finally {
    marking.value = false
  }
}

async function clearAll() {
  clearing.value = true
  try {
    await notifApi.clear()
    notifications.value = []
    meta.value = null
  } catch {} finally {
    clearing.value = false
  }
}

function goToOrder(item: OrderNotification) {
  markRead(item)
  router.push({ name: 'sale-detail', params: { id: item.order_id } })
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader :title="t('nav.notifications')" />

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div class="flex gap-3">
            <Select v-model="readFilter" :options="readOptions" class="w-32 h-9 text-xs border-border/40 bg-background" />
            <Select v-model="typeFilter" :options="typeOptions" class="w-40 h-9 text-xs border-border/40 bg-background" />
          </div>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" :disabled="clearing" @click="clearAll">
              <Trash2 class="size-3.5 mr-1.5" />
              {{ t('common.clear') }}
            </Button>
            <Button variant="outline" size="sm" :disabled="marking" @click="markAllRead">
              <CheckCheck class="size-3.5 mr-1.5" />
              {{ t('common.mark_all_read') }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <LoadingSpinner v-if="loading && !notifications.length" />

    <EmptyState v-else-if="!notifications.length" :icon="Bell" :text="t('common.no_data')" />

    <div v-else class="space-y-2">
      <div
        v-for="item in notifications"
        :key="item.id"
        @click="goToOrder(item)"
        class="flex items-start gap-4 p-4 rounded-lg border border-border/60 hover:bg-accent transition-colors cursor-pointer"
        :class="!item.read_at ? 'bg-accent/30 border-accent' : ''"
      >
        <component :is="typeIcons[item.type] || Bell" class="size-5 mt-0.5 shrink-0 text-muted-foreground" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium truncate">{{ item.title }}</p>
            <Badge v-if="!item.read_at" variant="default" class="text-[10px] px-1.5 py-0 h-4">
              {{ t('common.new') }}
            </Badge>
          </div>
          <p class="text-xs text-muted-foreground mt-1">{{ item.body }}</p>
          <p class="text-[11px] text-muted-foreground/60 mt-1.5">{{ item.diff_for_humans }}</p>
        </div>
        <ExternalLink class="size-4 shrink-0 mt-1.5 text-muted-foreground/40" />
      </div>
    </div>

    <Pagination v-if="meta" :meta="meta" @page="load" />
  </div>
</template>

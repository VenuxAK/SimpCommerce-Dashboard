<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Bell, PackageCheck, Truck, CreditCard, RefreshCw, ExternalLink, CheckCheck, Trash2 } from 'lucide-vue-next'
import { useNotificationApi } from '../composables/api/useNotificationApi'
import type { OrderNotification } from '../types'

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const router = useRouter()
const notifApi = useNotificationApi()

const items = ref<OrderNotification[]>([])
const loading = ref(true)
const marking = ref(false)
const clearing = ref(false)

const typeIcons: Record<string, any> = {
  new_order: PackageCheck,
  status_change: RefreshCw,
  shipment_update: Truck,
  payment_confirmed: CreditCard,
}

async function load() {
  loading.value = true
  try {
    const res = await notifApi.list({ per_page: 10 })
    items.value = res.data?.data ?? []
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

async function markRead(item: OrderNotification) {
  if (item.read_at) return
  try {
    await notifApi.markRead(item.id)
    item.read_at = new Date().toISOString()
  } catch {}
}

function goToOrder(item: OrderNotification) {
  markRead(item)
  emit('close')
  router.push({ name: 'sale-detail', params: { id: item.order_id } })
}

async function markAllRead() {
  marking.value = true
  try {
    await notifApi.markAllRead()
    items.value.forEach((i) => { i.read_at = new Date().toISOString() })
  } catch {} finally {
    marking.value = false
  }
}

async function clearAll() {
  clearing.value = true
  try {
    await notifApi.clear()
    items.value = []
  } catch {} finally {
    clearing.value = false
  }
}

function viewAll() {
  emit('close')
  router.push({ name: 'notifications' })
}

onMounted(load)
</script>

<template>
  <div class="notif-dropdown absolute right-0 top-full mt-1.5 w-80 rounded-lg border bg-popover shadow-lg z-50 text-popover-foreground animate-in fade-in zoom-in-95">
    <div class="flex items-center justify-between px-3 py-2 border-b">
      <span class="text-xs font-semibold">{{ t('nav.notifications') }}</span>
      <div class="flex items-center gap-2">
        <button
          @click="clearAll"
          :disabled="clearing"
          class="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
        >
          <Trash2 class="size-3" />
          {{ t('common.clear') }}
        </button>
        <button
          @click="markAllRead"
          :disabled="marking"
          class="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <CheckCheck class="size-3" />
          {{ t('common.mark_all_read') }}
        </button>
      </div>
    </div>

    <div class="max-h-80 overflow-y-auto">
      <div v-if="loading" class="flex items-center justify-center py-8">
        <span class="text-xs text-muted-foreground">{{ t('common.loading') }}</span>
      </div>
      <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Bell class="size-6 mb-2 opacity-40" />
        <span class="text-xs">{{ t('common.no_data') }}</span>
      </div>
      <template v-else>
        <button
          v-for="item in items"
          :key="item.id"
          @click="goToOrder(item)"
          class="flex items-start gap-3 w-full text-left px-3 py-2.5 hover:bg-accent transition-colors border-b border-border/40 last:border-b-0"
          :class="!item.read_at ? 'bg-accent/30' : ''"
        >
          <component :is="typeIcons[item.type] || Bell" class="size-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium truncate">{{ item.title }}</p>
            <p class="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{{ item.body }}</p>
            <p class="text-[10px] text-muted-foreground/60 mt-1">{{ item.diff_for_humans }}</p>
          </div>
          <ExternalLink class="size-3 shrink-0 mt-1 text-muted-foreground/40" />
        </button>
      </template>
    </div>

    <div class="flex items-center justify-center border-t px-3 py-2">
      <button @click="viewAll" class="text-xs text-primary hover:underline">
        {{ t('common.view_all') }}
      </button>
    </div>
  </div>
</template>

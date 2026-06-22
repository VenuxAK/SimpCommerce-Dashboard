<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Search, Eye, FileText } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import Input from '../../components/ui/Input.vue'
import Select from '../../components/ui/Select.vue'
import { Badge } from '../../components/ui/badge'
import Pagination from '../../components/Pagination.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import PageHeader from '../../components/PageHeader.vue'
import { useListing, useDebouncedWatch, statusBadge } from '../../composables'

const { t } = useI18n()
const router = useRouter()

const { items: orders, meta, loading, loadPage } = useListing<any>('/orders', { immediate: false })

const search = ref('')
const status = ref('')
const source = ref('')

const statusOptions = [
  { label: t('common.all'), value: '' },
  { label: t('sales.status_pending').toUpperCase(), value: 'pending' },
  { label: t('sales.status_completed').toUpperCase(), value: 'completed' },
  { label: 'PROCESSING', value: 'processing' },
  { label: 'SHIPPED', value: 'shipped' },
  { label: 'DELIVERED', value: 'delivered' },
  { label: t('sales.status_cancelled').toUpperCase(), value: 'cancelled' },
  { label: t('sales.status_refunded').toUpperCase(), value: 'refunded' },
]

const sourceOptions = [
  { label: t('common.all'), value: '' },
  { label: 'POS', value: 'pos' },
  { label: 'ONLINE', value: 'online' },
]

useDebouncedWatch([search, status, source], () => loadPage(1))

loadPage(1)
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader :title="t('sales.title')" :subtitle="t('sales.manage')" />

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input v-model="search" :placeholder="t('common.search') + ' (Order #, Customer...)'" class="pl-9 h-9 text-xs border-border/40 shadow-none bg-background" />
          </div>
          <div class="flex gap-3">
            <Select v-model="source" :options="sourceOptions" class="w-36 h-9 text-xs border-border/40 bg-background" />
            <Select v-model="status" :options="statusOptions" class="w-44 h-9 text-xs border-border/40 bg-background" />
          </div>
        </div>
      </CardContent>
    </Card>

    <LoadingSpinner v-if="loading" />

    <EmptyState v-else-if="orders.length === 0" :icon="FileText" :title="t('common.no_data')" />

    <div v-else class="border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('sales.order_number') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('sales.customer') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">Source</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('common.date') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">{{ t('common.status') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('sales.total') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-20">{{ t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="order in orders" :key="order.id" class="hover:bg-muted/30 transition-colors group">
              <td class="px-6 py-4 font-semibold text-foreground">
                {{ order.order_number }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="size-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold border">
                    {{ order.customer?.name?.charAt(0) || '?' }}
                  </div>
                  <span>{{ order.customer?.name || 'Walk-in Customer' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <Badge v-if="order.source === 'online'" variant="default" class="font-medium h-5 px-2 text-[10px]">ONLINE</Badge>
                <Badge v-else variant="outline" class="font-medium h-5 px-2 text-[10px]">POS</Badge>
              </td>
              <td class="px-6 py-4 text-muted-foreground tabular-nums">
                {{ order.created_at }}
              </td>
              <td class="px-6 py-4 text-center">
                <Badge :variant="statusBadge(order.status) as any" class="font-medium h-5 px-2 text-[10px]">
                  {{ order.status.toUpperCase() }}
                </Badge>
              </td>
              <td class="px-6 py-4 text-right font-bold tabular-nums">
                {{ order.total_amount.toLocaleString() }} Ks
              </td>
              <td class="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" class="size-7" @click="router.push(`/sales/${order.id}`)">
                  <Eye class="size-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="pt-8">
      <Pagination :meta="meta" @page="loadPage" />
    </div>
  </div>
</template>

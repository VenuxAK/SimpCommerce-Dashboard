<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import Input from '../../components/ui/Input.vue'
import Select from '../../components/ui/Select.vue'
import Pagination from '../../components/Pagination.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import PageHeader from '../../components/PageHeader.vue'
import { useListing, useDebouncedWatch } from '../../composables'
import type { AuditLog } from '../../types'
import { ScrollText, User, Pencil, Plus, Trash, Eye } from 'lucide-vue-next'

const { t } = useI18n()

const { items: logs, meta, loading, loadPage } = useListing<AuditLog>('/audit-logs', { immediate: false })

const actionFilter = ref('')
const modelFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const actionOptions = [
  { label: t('common.all'), value: '' },
  { label: 'CREATED', value: 'created' },
  { label: 'UPDATED', value: 'updated' },
  { label: 'DELETED', value: 'deleted' },
]

const modelOptions = [
  { label: t('common.all'), value: '' },
  { label: 'Order', value: 'Order' },
  { label: 'Product', value: 'Product' },
  { label: 'Customer', value: 'Customer' },
  { label: 'User', value: 'User' },
  { label: 'Category', value: 'Category' },
  { label: 'Brand', value: 'Brand' },
  { label: 'Discount', value: 'Discount' },
  { label: 'Supplier', value: 'Supplier' },
]

useDebouncedWatch([actionFilter, modelFilter, dateFrom, dateTo], () => loadPage(1))

loadPage(1)

const actionIcon = (action: string) => {
  switch (action) {
    case 'created': return Plus
    case 'updated': return Pencil
    case 'deleted': return Trash
    default: return Eye
  }
}

const actionVariant = (action: string): 'success' | 'default' | 'destructive' | 'secondary' | 'outline' | 'warning' => {
  switch (action) {
    case 'created': return 'success'
    case 'updated': return 'default'
    case 'deleted': return 'destructive'
    default: return 'secondary'
  }
}

const modelLabel = (type: string) => {
  return type.split('\\').pop() || type
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader :title="t('nav.audit')" :subtitle="t('audit.manage')" />

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <div class="flex flex-wrap items-center gap-3">
          <Input v-model="dateFrom" type="date" class="w-40 h-9 text-xs bg-background" />
          <span class="text-xs text-muted-foreground">to</span>
          <Input v-model="dateTo" type="date" class="w-40 h-9 text-xs bg-background" />
          <Select v-model="actionFilter" :options="actionOptions" class="w-36 h-9 text-xs bg-background" />
          <Select v-model="modelFilter" :options="modelOptions" class="w-36 h-9 text-xs bg-background" />
        </div>
      </CardContent>
    </Card>

    <LoadingSpinner v-if="loading" />

    <EmptyState v-else-if="logs.length === 0" :icon="ScrollText" :title="t('common.no_data')" />

    <div v-else class="border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('common.date') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('users.name') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">{{ t('common.actions') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('common.type') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-muted/30 transition-colors group">
              <td class="px-6 py-4 text-muted-foreground tabular-nums whitespace-nowrap">
                {{ log.created_at?.split('T')[0] }}
                <span class="text-[10px] opacity-50 ml-1">{{ log.created_at?.split('T')[1]?.split('.')[0] }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="size-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold border shrink-0">
                    {{ log.user?.name?.charAt(0) || 'S' }}
                  </div>
                  <span class="font-medium text-foreground">{{ log.user?.name || 'System' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <Badge :variant="actionVariant(log.action)" class="h-5 px-2 text-[9px] font-medium uppercase inline-flex items-center gap-1">
                  <component :is="actionIcon(log.action)" class="size-2.5" />
                  {{ log.action }}
                </Badge>
              </td>
              <td class="px-6 py-4 text-muted-foreground">
                <span class="font-medium">{{ modelLabel(log.model_type) }}</span>
                <span class="text-[10px] opacity-50 ml-1">(#{{ log.model_id }})</span>
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

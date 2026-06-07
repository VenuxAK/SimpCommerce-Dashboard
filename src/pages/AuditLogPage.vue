<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Card, CardContent } from '../components/ui/card'
import Select from '../components/ui/Select.vue'
import { Badge } from '../components/ui/badge'
import Pagination from '../components/Pagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import { useListing, useDebouncedWatch } from '../composables'
import type { AuditLog } from '../types'
import { Activity } from 'lucide-vue-next'

const { t } = useI18n()
const { items: logs, meta, loading, loadPage } = useListing<AuditLog>('/audit-logs', { immediate: false })

const actionFilter = ref('')

const actionOptions = [
  { label: 'ALL ACTIONS', value: '' },
  { label: 'CREATED', value: 'created' },
  { label: 'UPDATED', value: 'updated' },
  { label: 'DELETED', value: 'deleted' },
]

useDebouncedWatch(actionFilter, () => loadPage(1))

loadPage(1)
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader title="Audit Log" subtitle="Review system activity and administrative changes" />

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <Select v-model="actionFilter" :options="actionOptions" class="w-48 h-9 text-xs bg-background" />
      </CardContent>
    </Card>

    <LoadingSpinner v-if="loading" />

    <EmptyState v-else-if="logs.length === 0" :icon="Activity" :title="t('common.no_data')" />

    <div v-else class="border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">User</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">Action</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Target</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">ID</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-muted/30 transition-colors group">
              <td class="px-6 py-4 text-muted-foreground tabular-nums whitespace-nowrap">
                {{ log.created_at?.split('T')[0] }} {{ log.created_at?.split('T')[1]?.split('.')[0] }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="size-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold border">
                    {{ log.user?.name?.charAt(0) || '?' }}
                  </div>
                  <span class="font-semibold text-foreground">{{ log.user?.name || 'System' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <Badge variant="secondary" class="h-5 px-1.5 text-[9px] font-medium uppercase">
                  {{ log.action }}
                </Badge>
              </td>
              <td class="px-6 py-4 text-muted-foreground font-medium">
                {{ log.model_type?.split('\\').pop() }}
              </td>
              <td class="px-6 py-4 text-right tabular-nums text-muted-foreground font-medium">
                {{ log.model_id }}
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

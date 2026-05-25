<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Card, CardContent } from '../components/ui/card'
import Select from '../components/ui/Select.vue'
import { Badge } from '../components/ui/badge'
import Pagination from '../components/Pagination.vue'
import type { AuditLog } from '../types'
import { Activity } from 'lucide-vue-next'

const { t } = useI18n()
const logs = ref<AuditLog[]>([])
const meta = ref<any>(null)
const loading = ref(true)
const actionFilter = ref('')

const actionOptions = [
  { label: 'ALL ACTIONS', value: '' },
  { label: 'CREATED', value: 'created' },
  { label: 'UPDATED', value: 'updated' },
  { label: 'DELETED', value: 'deleted' },
]

async function loadPage(page = 1) {
  loading.value = true
  try {
    const params: Record<string, any> = { page }
    if (actionFilter.value) params.action = actionFilter.value
    const { data } = await api.get('/audit-logs', { params })
    logs.value = data.data
    meta.value = { current_page: data.meta.current_page, last_page: data.meta.last_page, total: data.meta.total, per_page: data.meta.per_page }
  } catch {}
  finally { loading.value = false }
}

onMounted(() => loadPage())
watch(actionFilter, () => loadPage(1))
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">Audit Log</h1>
        <p class="text-xs text-muted-foreground mt-1">Review system activity and administrative changes</p>
      </div>
    </div>

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <Select v-model="actionFilter" :options="actionOptions" class="w-48 h-9 text-xs bg-background" />
      </CardContent>
    </Card>

    <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
      <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else-if="logs.length === 0" class="py-20 text-center border border-dashed rounded-xl">
      <Activity class="size-10 mx-auto text-muted-foreground/20 mb-4" />
      <p class="text-sm font-medium text-muted-foreground">{{ t('common.no_data') }}</p>
    </div>

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

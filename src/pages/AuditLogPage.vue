<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Card, CardContent } from '../components/ui/card'
import Pagination from '../components/Pagination.vue'
import type { AuditLog } from '../types'

const { t } = useI18n()
const logs = ref<AuditLog[]>([])
const meta = ref<any>(null)
const loading = ref(true)
const actionFilter = ref('')

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
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">Audit Log</h1>

    <select v-model="actionFilter" @change="loadPage(1)"
      class="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
      <option value="">All actions</option>
      <option value="created">Created</option>
      <option value="updated">Updated</option>
      <option value="deleted">Deleted</option>
    </select>

    <div v-if="loading" class="text-sm text-zinc-400">{{ t('common.loading') }}</div>

    <Card v-else>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left text-zinc-500 dark:text-zinc-400 font-medium">Date</th>
              <th class="px-3 sm:px-4 py-3 text-left text-zinc-500 dark:text-zinc-400 font-medium">User</th>
              <th class="px-3 sm:px-4 py-3 text-left text-zinc-500 dark:text-zinc-400 font-medium">Action</th>
              <th class="px-3 sm:px-4 py-3 text-left text-zinc-500 dark:text-zinc-400 font-medium">Model</th>
              <th class="px-3 sm:px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 font-medium">ID</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" class="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
              <td class="px-3 sm:px-4 py-3 whitespace-nowrap text-zinc-600">{{ log.created_at?.split('T')[0] }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-700 dark:text-zinc-300">{{ log.user?.name || '—' }}</td>
              <td class="px-3 sm:px-4 py-3"><span class="capitalize">{{ log.action }}</span></td>
              <td class="px-3 sm:px-4 py-3 text-zinc-500">{{ log.model_type?.split('\\').pop() }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-500">{{ log.model_id }}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { HardDrive, Download } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import PageHeader from '../../components/PageHeader.vue'
import { useNotify } from '../../lib/notify'
import { useBackupApi } from '../../composables/api'

const { t } = useI18n()
const { success, error } = useNotify()
const backupApi = useBackupApi()

const backups = ref<any[]>([])
const loading = ref(true)
const creating = ref(false)

onMounted(loadBackups)

async function loadBackups() {
  loading.value = true
  try {
    const res = await backupApi.list()
    backups.value = res.data.data || []
  } catch {
    error('Failed to load backups.')
  } finally {
    loading.value = false
  }
}

async function createBackup() {
  creating.value = true
  try {
    const res = await backupApi.create()
    success(res.data.message || 'Backup queued for processing')
    await loadBackups()
  } catch {
    error('Failed to create backup.')
  } finally {
    creating.value = false
  }
}

async function downloadBackup(filename: string) {
  try {
    const response = await backupApi.download(filename)
    const blob = new Blob([response.data], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    error('Failed to download backup.')
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader
      :title="t('nav.backups')"
      :subtitle="'Manage database backups'"
    />

    <div class="flex justify-end">
      <Button size="sm" :disabled="creating" @click="createBackup">
        {{ creating ? 'Creating...' : 'Create Backup' }}
      </Button>
    </div>

    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="backups.length === 0" :icon="HardDrive" :title="'No backups found'" />

    <div v-else class="border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Filename</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="b in backups" :key="b.filename" class="hover:bg-muted/30 transition-colors group">
              <td class="px-6 py-4 font-medium">{{ b.filename }}</td>
              <td class="px-6 py-4 text-muted-foreground">{{ formatBytes(b.size) }}</td>
              <td class="px-6 py-4 text-muted-foreground">{{ b.created_at }}</td>
              <td class="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" class="size-7" @click="downloadBackup(b.filename)">
                  <Download class="size-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Wallet, X } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import Input from '../../components/ui/Input.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import PageHeader from '../../components/PageHeader.vue'
import { useNotify } from '../../lib/notify'
import { useCashSessionApi } from '../../composables/api'
import type { CashSession } from '../../types'

const { t } = useI18n()
const { success, error } = useNotify()
const cashApi = useCashSessionApi()

const sessions = ref<CashSession[]>([])
const activeSession = ref<CashSession | null>(null)
const loading = ref(true)
const openingBalance = ref(0)
const closingBalance = ref(0)
const showOpenDialog = ref(false)
const showCloseDialog = ref(false)
const processing = ref(false)

onMounted(async () => {
  try {
    const [sessRes, activeRes] = await Promise.all([
      cashApi.list(),
      cashApi.active(),
    ])
    sessions.value = sessRes.data.data || []
    activeSession.value = activeRes.data.data ?? null
  } catch {}
  finally { loading.value = false }
})

const openSession = async () => {
  processing.value = true
  try {
    await cashApi.open(openingBalance.value)
    success('Session opened ✅')
    showOpenDialog.value = false
    const [sessRes, activeRes] = await Promise.all([
      cashApi.list(),
      cashApi.active(),
    ])
    sessions.value = sessRes.data.data || []
    activeSession.value = activeRes.data.data ?? null
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
  finally { processing.value = false }
}

const closeSession = async () => {
  processing.value = true
  try {
    const res = await cashApi.close(closingBalance.value)
    const diff = res.data.data.difference
    showCloseDialog.value = false
    if (Math.abs(diff) > 0) {
      success(`Session closed. Difference: ${diff > 0 ? '+' : ''}${(diff || 0).toLocaleString()} Ks`)
    } else {
      success('Session closed ✅')
    }
    const [sessRes, activeRes] = await Promise.all([
      cashApi.list(),
      cashApi.active(),
    ])
    sessions.value = sessRes.data.data || []
    activeSession.value = activeRes.data.data ?? null
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
  finally { processing.value = false }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader :title="t('nav.cash')" :subtitle="t('cash.manage')" />

    <LoadingSpinner v-if="loading" />

    <div v-else class="space-y-6">
      <div class="flex items-center gap-4 p-4 rounded-lg border"
        :class="activeSession ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-border'">
        <Wallet class="size-6" :class="activeSession ? 'text-green-600' : 'text-muted-foreground'" />
        <div class="flex-1">
          <p class="font-medium text-foreground">{{ activeSession ? t('cash.open') : t('cash.register_closed') }}</p>
          <p v-if="activeSession" class="text-sm text-muted-foreground">
            {{ t('common.date') }}: {{ activeSession.opened_at }} · {{ t('reports.total_sales') }}: {{ (activeSession.opening_balance || 0).toLocaleString() }} Ks
          </p>
        </div>
        <Button v-if="!activeSession" variant="default" @click="showOpenDialog = true">{{ t('cash.open_register') }}</Button>
        <Button v-else variant="destructive" @click="showCloseDialog = true">{{ t('cash.close') }}</Button>
      </div>

      <Card v-if="showOpenDialog" class="max-w-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Open Register</CardTitle>
          <button @click="showOpenDialog = false" class="text-muted-foreground"><X class="size-4" /></button>
        </CardHeader>
        <CardContent class="space-y-3">
          <Input v-model.number="openingBalance" type="number" min="0" placeholder="Opening balance (Ks)" />
          <Button :disabled="processing" @click="openSession" class="w-full">{{ processing ? t('common.loading') : 'Open' }}</Button>
        </CardContent>
      </Card>

      <Card v-if="showCloseDialog" class="max-w-sm">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle>Close Register</CardTitle>
          <button @click="showCloseDialog = false" class="text-muted-foreground"><X class="size-4" /></button>
        </CardHeader>
        <CardContent class="space-y-3">
          <Input v-model.number="closingBalance" type="number" min="0" placeholder="Closing balance (Ks)" />
          <Button variant="destructive" :disabled="processing" @click="closeSession" class="w-full">{{ processing ? t('common.loading') : 'Close' }}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{{ t('cash.session_history') }}</CardTitle></CardHeader>
        <CardContent class="p-0 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="border-b bg-muted/30">
              <tr>
                <th class="px-3 sm:px-4 py-3 text-left text-muted-foreground font-medium">{{ t('common.date') }}</th>
                <th class="px-3 sm:px-4 py-3 text-left text-muted-foreground font-medium hidden sm:table-cell">{{ t('nav.users') }}</th>
                <th class="px-3 sm:px-4 py-3 text-right text-muted-foreground font-medium">{{ t('cash.open') }}</th>
                <th class="px-3 sm:px-4 py-3 text-right text-muted-foreground font-medium">{{ t('cash.close') }}</th>
                <th class="px-3 sm:px-4 py-3 text-right text-muted-foreground font-medium">{{ t('common.diff') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sessions" :key="s.id" class="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td class="px-3 sm:px-4 py-3 whitespace-nowrap text-muted-foreground">{{ s.opened_at?.split('T')[0] }}</td>
                <td class="px-3 sm:px-4 py-3 text-muted-foreground hidden sm:table-cell">{{ s.user?.name }}</td>
                <td class="px-3 sm:px-4 py-3 text-right text-foreground/80">{{ (s.opening_balance || 0).toLocaleString() }} Ks</td>
                <td class="px-3 sm:px-4 py-3 text-right text-foreground/80">{{ s.closing_balance != null ? s.closing_balance.toLocaleString() : '—' }} Ks</td>
                <td class="px-3 sm:px-4 py-3 text-right">
                  <span v-if="s.difference != null" :class="s.difference >= 0 ? 'text-green-600' : 'text-red-600'" class="font-semibold">
                    {{ s.difference > 0 ? '+' : '' }}{{ (s.difference || 0).toLocaleString() }}
                  </span>
                  <span v-else class="text-muted-foreground">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Wallet, X } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import { useNotify } from '../lib/notify'
import type { CashSession } from '../types'

const { t } = useI18n()
const { success, error } = useNotify()
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
      api.get('/cash-sessions'),
      api.get('/cash-sessions/active'),
    ])
    sessions.value = sessRes.data.data || []
    activeSession.value = activeRes.data.data ?? null
  } catch {}
  finally { loading.value = false }
})

async function openSession() {
  processing.value = true
  try {
    await api.post('/cash-sessions/open', { opening_balance: openingBalance.value })
    success('Session opened ✅')
    showOpenDialog.value = false
    const [sessRes, activeRes] = await Promise.all([
      api.get('/cash-sessions'),
      api.get('/cash-sessions/active'),
    ])
    sessions.value = sessRes.data.data || []
    activeSession.value = activeRes.data.data ?? null
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
  finally { processing.value = false }
}

async function closeSession() {
  processing.value = true
  try {
    const res = await api.post('/cash-sessions/close', { closing_balance: closingBalance.value })
    const diff = res.data.data.difference
    showCloseDialog.value = false
    if (Math.abs(diff) > 0) {
      success(`Session closed. Difference: ${diff > 0 ? '+' : ''}${(diff || 0).toLocaleString()} Ks`)
    } else {
      success('Session closed ✅')
    }
    const [sessRes, activeRes] = await Promise.all([
      api.get('/cash-sessions'),
      api.get('/cash-sessions/active'),
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
  <div class="space-y-4">
    <h1 class="text-xl sm:text-2xl font-semibold text-foreground">{{ t('nav.cash') }}</h1>

    <div v-if="loading" class="text-sm text-muted-foreground">{{ t('common.loading') }}</div>

    <div v-if="!loading" class="flex items-center gap-4 p-4 rounded-lg border"
      :class="activeSession ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' : 'border-border'">
      <Wallet class="size-6" :class="activeSession ? 'text-green-600' : 'text-muted-foreground'" />
      <div class="flex-1">
        <p class="font-medium text-foreground">
          {{ activeSession ? 'Register Open' : 'Register Closed' }}
        </p>
        <p v-if="activeSession" class="text-sm text-muted-foreground">
          Opened: {{ activeSession.opened_at }} · Balance: {{ (activeSession.opening_balance || 0).toLocaleString() }} Ks
        </p>
      </div>
      <Button v-if="!activeSession" variant="default" @click="showOpenDialog = true">Open Register</Button>
      <Button v-else variant="destructive" @click="showCloseDialog = true">Close Register</Button>
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
      <CardHeader><CardTitle>Session History</CardTitle></CardHeader>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-muted/30">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left text-muted-foreground font-medium">Date</th>
              <th class="px-3 sm:px-4 py-3 text-left text-muted-foreground font-medium hidden sm:table-cell">User</th>
              <th class="px-3 sm:px-4 py-3 text-right text-muted-foreground font-medium">Open</th>
              <th class="px-3 sm:px-4 py-3 text-right text-muted-foreground font-medium">Close</th>
              <th class="px-3 sm:px-4 py-3 text-right text-muted-foreground font-medium">Diff</th>
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
</template>

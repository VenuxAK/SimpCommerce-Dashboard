<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Search, Eye, FileText, Printer, FileDown } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import { Badge } from '../components/ui/badge'
import Pagination from '../components/Pagination.vue'
import { useNotify } from '../lib/notify'

const { t } = useI18n()
const router = useRouter()
const { error } = useNotify()

const invoices = ref<any[]>([])
const loading = ref(true)
const meta = ref<any>({})
const page = ref(1)

// Filters
const search = ref('')
const status = ref('')

const statusOptions = [
  { label: 'ALL STATUS', value: '' },
  { label: 'PAID', value: 'paid' },
  { label: 'ISSUED', value: 'issued' },
  { label: 'CANCELLED', value: 'cancelled' },
  { label: 'REFUNDED', value: 'refunded' },
]

async function load(p = 1) {
  loading.value = true
  page.value = p
  try {
    const { data } = await api.get('/invoices', {
      params: {
        page: p,
        search: search.value,
        status: status.value || undefined,
      },
    })
    invoices.value = data.data
    meta.value = data.meta
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

let timer: any
watch([search, status], () => {
  clearTimeout(timer)
  timer = setTimeout(() => load(1), 300)
})

onMounted(() => load(1))

function statusBadge(s: string) {
  const map: any = { paid: 'success', issued: 'warning', cancelled: 'destructive', refunded: 'secondary' }
  return map[s] || 'default'
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ t('invoices.title') }}</h1>
        <p class="text-xs text-muted-foreground mt-1">Manage and track your official billing documents</p>
      </div>
    </div>

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input v-model="search" :placeholder="t('common.search') + ' (Invoice #...)'" class="pl-9 h-9 shadow-none bg-background" />
          </div>
          <div class="flex gap-3">
            <Select v-model="status" :options="statusOptions" class="w-48 h-9 bg-background" />
          </div>
        </div>
      </CardContent>
    </Card>

    <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
      <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else-if="invoices.length === 0" class="py-20 text-center border border-dashed rounded-xl">
      <FileText class="size-10 mx-auto text-muted-foreground/20 mb-4" />
      <p class="text-sm font-medium text-muted-foreground">{{ t('common.no_data') }}</p>
    </div>

    <div v-else class="border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('invoices.invoice_number') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('invoices.issued_date') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('invoices.due_date') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-muted/30 transition-colors group">
              <td class="px-6 py-4 font-semibold text-foreground">
                {{ inv.invoice_number }}
              </td>
              <td class="px-6 py-4 text-muted-foreground tabular-nums">
                {{ inv.issued_date }}
              </td>
              <td class="px-6 py-4 text-muted-foreground tabular-nums">
                {{ inv.due_date || '—' }}
              </td>
              <td class="px-6 py-4 text-center">
                <Badge :variant="statusBadge(inv.status) as any" class="h-5 px-1.5 text-[10px] font-medium">
                  {{ inv.status.toUpperCase() }}
                </Badge>
              </td>
              <td class="px-6 py-4 text-right font-bold tabular-nums">
                {{ inv.total_amount.toLocaleString() }} Ks
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" class="size-7" @click="router.push(`/invoices/${inv.id}`)">
                    <Printer class="size-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="pt-8">
      <Pagination :meta="meta" @page="load" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Search, FileText, Printer } from 'lucide-vue-next'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import { Badge } from '../components/ui/badge'
import Pagination from '../components/Pagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import { useListing, useDebouncedWatch, statusBadge } from '../composables'

const { t } = useI18n()
const router = useRouter()

const { items: invoices, meta, loading, loadPage } = useListing<any>('/invoices', { immediate: false })

const search = ref('')
const status = ref('')

const statusOptions = [
  { label: t('common.all'), value: '' },
  { label: t('invoices.status_paid').toUpperCase(), value: 'paid' },
  { label: t('invoices.status_issued').toUpperCase(), value: 'issued' },
  { label: t('invoices.status_cancelled').toUpperCase(), value: 'cancelled' },
  { label: t('invoices.status_refunded').toUpperCase(), value: 'refunded' },
]

useDebouncedWatch([search, status], () => loadPage(1))

loadPage(1)
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader :title="t('invoices.title')" :subtitle="t('invoices.manage')" />

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

    <LoadingSpinner v-if="loading" />

    <EmptyState v-else-if="invoices.length === 0" :icon="FileText" :title="t('common.no_data')" />

    <div v-else class="border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('invoices.invoice_number') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('invoices.issued_date') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('invoices.due_date') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-center">{{ t('common.status') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('common.amount') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-20">{{ t('common.actions') }}</th>
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
      <Pagination :meta="meta" @page="loadPage" />
    </div>
  </div>
</template>

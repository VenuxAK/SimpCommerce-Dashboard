<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Trash2 } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import { useNotify } from '../lib/notify'
import Pagination from '../components/Pagination.vue'
import type { Customer } from '../types'

const { t } = useI18n()
const router = useRouter()
const { error, success } = useNotify()
const customers = ref<Customer[]>([])
const meta = ref<any>(null)
const search = ref('')
const loading = ref(true)

async function loadPage(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/customers', { params: { page } })
    customers.value = data.data
    meta.value = { current_page: data.meta.current_page, last_page: data.meta.last_page, total: data.meta.total, per_page: data.meta.per_page }
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage())

const filtered = computed(() =>
  customers.value.filter((c) => {
    if (!search.value) return true
    const q = search.value.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
  }),
)

async function remove(id: number) {
  if (!confirm(t('common.confirm') + '?')) return
  try {
    await api.delete(`/customers/${id}`)
    customers.value = customers.value.filter((c) => c.id !== id)
    success(t('common.delete') + ' ✅')
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('customers.title') }}</h1>
    </div>

    <Input v-model="search" :placeholder="t('common.search')" class="sm:max-w-xs" />

    <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

    <Card v-else>
      <CardContent class="p-0 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="border-b bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('customers.name') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden sm:table-cell">{{ t('customers.email') }}</th>
              <th class="px-3 sm:px-4 py-3 text-left whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium hidden md:table-cell">{{ t('customers.phone') }}</th>
              <th class="px-3 sm:px-4 py-3 text-right whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-medium">{{ t('customers.loyalty_points') }}</th>
              <th class="px-3 sm:px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filtered" :key="c.id"
              class="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
              @click="router.push('/customers/' + c.id)"
            >
              <td class="px-3 sm:px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-28 sm:max-w-none">{{ c.name }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400 truncate max-w-28 hidden sm:table-cell">{{ c.email || '—' }}</td>
              <td class="px-3 sm:px-4 py-3 text-zinc-500 dark:text-zinc-400 hidden md:table-cell">{{ c.phone || '—' }}</td>
              <td class="px-3 sm:px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{{ c.loyalty_points }}</td>
              <td class="px-3 sm:px-4 py-3 text-right">
                <Button variant="ghost" size="icon" @click.stop="remove(c.id)" class="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400">
                  <Trash2 class="size-4" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>

    <p v-if="!loading && filtered.length === 0" class="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">{{ t('common.no_data') }}</p>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

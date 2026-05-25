<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Plus, Search, User, Eye, Phone, Mail, X, Check } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import { useNotify } from '../lib/notify'
import Pagination from '../components/Pagination.vue'
import type { Customer } from '../types'

const { t } = useI18n()
const router = useRouter()
const { success, error } = useNotify()

const customers = ref<Customer[]>([])
const loading = ref(true)
const meta = ref<any>({})
const page = ref(1)
const search = ref('')
const showForm = ref(false)
const form = ref({ name: '', email: '', phone: '', address: '' })
const saving = ref(false)

async function load(p = 1) {
  loading.value = true
  page.value = p
  try {
    const { data } = await api.get('/customers', {
      params: { page: p, search: search.value },
    })
    customers.value = data.data
    meta.value = data.meta
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await api.post('/customers', form.value)
    success('Customer created.')
    showForm.value = false
    form.value = { name: '', email: '', phone: '', address: '' }
    await load(1)
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

let timer: any
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => load(1), 300)
})

onMounted(() => load(1))
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ t('customers.title') }}</h1>
        <p class="text-xs text-muted-foreground mt-1">Manage your customer database and loyalty</p>
      </div>
      <Button size="sm" @click="showForm = !showForm">
        <Plus class="size-3.5 mr-2" /> {{ t('customers.new_customer') }}
      </Button>
    </div>

    <Card v-if="showForm" class="border-border/60 bg-muted/5">
      <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
        <CardTitle class="text-sm font-medium">{{ t('customers.new_customer') }}</CardTitle>
        <button @click="showForm = false; form = { name: '', email: '', phone: '', address: '' }" class="text-muted-foreground hover:text-foreground transition-colors">
          <X class="size-4" />
        </button>
      </CardHeader>
      <CardContent class="p-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs text-muted-foreground ml-1">{{ t('customers.name') }}</label>
            <Input v-model="form.name" class="h-9" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-muted-foreground ml-1">{{ t('customers.email') }}</label>
            <Input v-model="form.email" type="email" class="h-9" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-muted-foreground ml-1">{{ t('customers.phone') }}</label>
            <Input v-model="form.phone" class="h-9" />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs text-muted-foreground ml-1">{{ t('customers.address') }}</label>
            <Input v-model="form.address" class="h-9" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" @click="showForm = false; form = { name: '', email: '', phone: '', address: '' }">{{ t('common.cancel') }}</Button>
          <Button size="sm" :disabled="saving || !form.name" @click="save">
            <Check class="size-3.5 mr-1.5" /> {{ t('common.save') }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card class="shadow-none border-border/60 bg-muted/5">
      <CardContent class="p-4">
        <div class="relative max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input v-model="search" :placeholder="t('common.search')" class="pl-9 h-9 text-xs border-border/40 shadow-none bg-background" />
        </div>
      </CardContent>
    </Card>

    <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
      <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else-if="customers.length === 0" class="py-20 text-center border rounded-xl border-dashed">
      <User class="size-10 mx-auto text-muted-foreground/20 mb-4" />
      <p class="text-sm font-medium text-muted-foreground">{{ t('common.no_data') }}</p>
    </div>

    <div v-else class="border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b bg-muted/20">
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider">{{ t('customers.name') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{{ t('customers.phone') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{{ t('customers.email') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right">{{ t('customers.loyalty_points') }}</th>
              <th class="px-6 py-3 font-semibold text-muted-foreground uppercase tracking-wider text-right w-20">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="c in customers" :key="c.id" class="hover:bg-muted/30 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="size-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold border">
                    {{ c.name.charAt(0) }}
                  </div>
                  <span class="font-semibold text-foreground group-hover:text-primary transition-colors">{{ c.name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-muted-foreground font-medium hidden sm:table-cell">
                <div class="flex items-center gap-1.5">
                  <Phone class="size-3 opacity-50" /> {{ c.phone || '—' }}
                </div>
              </td>
              <td class="px-6 py-4 text-muted-foreground font-medium hidden md:table-cell">
                <div class="flex items-center gap-1.5">
                  <Mail class="size-3 opacity-50" /> {{ c.email || '—' }}
                </div>
              </td>
              <td class="px-6 py-4 text-right font-bold tabular-nums">
                {{ c.loyalty_points.toLocaleString() }}
              </td>
              <td class="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" class="size-7" @click="router.push(`/customers/${c.id}`)">
                  <Eye class="size-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
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

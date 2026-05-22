<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import Pagination from '../components/Pagination.vue'
import { useNotify } from '../lib/notify'
import type { Discount, Category, Product } from '../types'

const { t } = useI18n()
const { success, error } = useNotify()
const discounts = ref<Discount[]>([])
const meta = ref<{ current_page: number; last_page: number; total: number; per_page: number } | null>(null)
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const showForm = ref(false)
const editing = ref<Discount | null>(null)
const form = ref({
  name: '', type: 'percentage', value: 0,
  applies_to: 'all', category_id: null as number | null,
  product_id: null as number | null,
  starts_at: '', ends_at: '', is_active: true,
})
const loading = ref(true)

async function loadPage(page = 1) {
  loading.value = true
  try {
    const [discRes, catRes, prodRes] = await Promise.all([
      api.get('/discounts', { params: { page } }),
      api.get('/categories'),
      api.get('/products'),
    ])
    discounts.value = discRes.data.data
    categories.value = catRes.data.data
    products.value = prodRes.data.data
    meta.value = { current_page: discRes.data.meta.current_page, last_page: discRes.data.meta.last_page, total: discRes.data.meta.total, per_page: discRes.data.meta.per_page }
  } catch { }
  finally { loading.value = false }
}

onMounted(() => loadPage())

function openCreate() {
  editing.value = null
  form.value = { name: '', type: 'percentage', value: 0, applies_to: 'all', category_id: null, product_id: null, starts_at: '', ends_at: '', is_active: true }
  showForm.value = true
}

function openEdit(d: any) {
  editing.value = d
  form.value = {
    name: d.name, type: d.type, value: d.value,
    applies_to: d.applies_to, category_id: d.category_id,
    product_id: d.product_id,
    starts_at: d.starts_at || '', ends_at: d.ends_at || '',
    is_active: d.is_active,
  }
  showForm.value = true
}

async function save() {
  try {
    const payload: Record<string, any> = { ...form.value }
    if (!payload.starts_at) payload.starts_at = null
    if (!payload.ends_at) payload.ends_at = null
    if (payload.applies_to !== 'category') payload.category_id = null
    if (payload.applies_to !== 'product') payload.product_id = null

    if (editing.value) {
      await api.put(`/discounts/${editing.value.id}`, payload)
      success(t('common.save') + ' ✅')
    } else {
      await api.post('/discounts', payload)
      success(t('common.create') + ' ✅')
    }
    showForm.value = false
    await loadPage(1)
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
}

async function remove(id: number) {
  if (!confirm(t('common.confirm') + '?')) return
  try {
    await api.delete(`/discounts/${id}`)
    discounts.value = discounts.value.filter((d: any) => d.id !== id)
    success(t('common.delete') + ' ✅')
  } catch { }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('nav.discounts') }}</h1>
      <Button @click="openCreate" class="w-full sm:w-auto"><Plus class="size-4" /> {{ t('common.create') }}</Button>
    </div>

    <div v-if="loading" class="text-sm text-zinc-400">{{ t('common.loading') }}</div>

    <Card v-if="showForm" class="max-w-lg">
      <CardHeader><CardTitle>{{ editing ? t('common.edit') : t('common.create') }}</CardTitle></CardHeader>
      <CardContent class="space-y-4">
        <Input v-model="form.name" :placeholder="t('validation.name')" />

        <div class="grid grid-cols-2 gap-3">
          <select v-model="form.type" class="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
            <option value="percentage">{{ t('validation.percentage') }}</option>
            <option value="fixed">{{ t('validation.fixed') }}</option>
          </select>
          <Input v-model.number="form.value" type="number" min="0" :placeholder="form.type === 'percentage' ? '%' : 'Ks'" />
        </div>

        <div>
          <label class="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1 block">{{ t('validation.applies_to') }}</label>
          <select v-model="form.applies_to" class="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
            <option value="all">{{ t('validation.all_items') }}</option>
            <option value="category">{{ t('validation.category_items') }}</option>
            <option value="product">{{ t('validation.product_items') }}</option>
          </select>
        </div>

        <div v-if="form.applies_to === 'category'">
          <label class="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1 block">{{ t('products.category') }}</label>
          <select v-model="form.category_id" class="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
            <option value="" disabled>{{ t('common.select') }}</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div v-if="form.applies_to === 'product'">
          <label class="text-xs font-medium text-zinc-400 dark:text-zinc-500 mb-1 block">{{ t('products.title') }}</label>
          <select v-model="form.product_id" class="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
            <option value="" disabled>{{ t('common.select') }}</option>
            <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <Input v-model="form.starts_at" type="date" :placeholder="t('validation.starts_at')" />
          <Input v-model="form.ends_at" type="date" :placeholder="t('validation.ends_at')" />
        </div>

        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="form.is_active" class="rounded" />
          {{ t('validation.is_active') }}
        </label>

        <div class="flex gap-2 pt-1">
          <Button @click="save">{{ t('common.save') }}</Button>
          <Button variant="outline" @click="showForm = false">{{ t('common.cancel') }}</Button>
        </div>
      </CardContent>
    </Card>

    <div v-if="!loading && discounts.length === 0" class="text-sm text-zinc-400 py-8 text-center">{{ t('validation.no_discounts') }}</div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="d in discounts" :key="d.id" class="transition-shadow hover:shadow-md">
        <CardContent class="p-4">
          <div class="flex items-start justify-between">
            <div class="min-w-0">
              <p class="font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ d.name }}</p>
              <p class="text-sm text-zinc-500 dark:text-zinc-400">
                {{ d.type === 'percentage' ? d.value + '%' : d.value.toLocaleString() + ' Ks' }}
                <span class="mx-1">·</span>
                {{ d.applies_to }}
              </p>
              <p v-if="d.applies_to === 'category' && d.category_id" class="text-xs text-zinc-400">
                Category: {{ categories.find((c: any) => c.id === d.category_id)?.name || '—' }}
              </p>
              <p v-if="d.applies_to === 'product' && d.product_id" class="text-xs text-zinc-400">
                Product: {{ products.find((p: any) => p.id === d.product_id)?.name || '—' }}
              </p>
              <p v-if="d.starts_at || d.ends_at" class="text-xs text-zinc-400">
                {{ d.starts_at || '—' }} ~ {{ d.ends_at || '—' }}
              </p>
            </div>
            <div class="flex gap-1 shrink-0">
              <Badge :variant="d.is_active ? 'success' : 'secondary'">{{ d.is_active ? 'ON' : 'OFF' }}</Badge>
              <Button variant="ghost" size="icon" @click="openEdit(d)"><Pencil class="size-4" /></Button>
              <Button variant="ghost" size="icon" @click="remove(d.id)" class="text-red-400"><Trash2 class="size-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

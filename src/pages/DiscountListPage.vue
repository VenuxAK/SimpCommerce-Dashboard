<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, Tag, Calendar, LayoutGrid } from 'lucide-vue-next'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import Pagination from '../components/Pagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import { useNotify } from '../lib/notify'
import { useListing } from '../composables'
import { useDiscountApi, useCategoryApi, useProductApi } from '../composables/api'
import type { Discount, Category, Product } from '../types'

const { t } = useI18n()
const { success, error } = useNotify()
const discountApi = useDiscountApi()
const categoryApi = useCategoryApi()
const productApi = useProductApi()

const { items: discounts, meta, loading, loadPage } = useListing<Discount>('/discounts')

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

const typeOptions = [
  { label: 'PERCENTAGE', value: 'percentage' },
  { label: 'FIXED AMOUNT', value: 'fixed' },
]

const appliesToOptions = [
  { label: 'ALL PRODUCTS', value: 'all' },
  { label: 'SPECIFIC CATEGORY', value: 'category' },
  { label: 'SPECIFIC PRODUCT', value: 'product' },
]

const categoryOptions = computed(() => [
  { label: 'SELECT CATEGORY', value: '' },
  ...categories.value.map(c => ({ label: c.name.toUpperCase(), value: c.id })),
])

const productOptions = computed(() => [
  { label: 'SELECT PRODUCT', value: '' },
  ...products.value.map(p => ({ label: p.name.toUpperCase(), value: p.id })),
])

onMounted(async () => {
  try {
    const [catRes, prodRes] = await Promise.all([
      categoryApi.list(),
      productApi.list(),
    ])
    categories.value = catRes.data.data
    products.value = prodRes.data.data
  } catch {}
})

const openCreate = () => {
  editing.value = null
  form.value = { name: '', type: 'percentage', value: 0, applies_to: 'all', category_id: null, product_id: null, starts_at: '', ends_at: '', is_active: true }
  showForm.value = true
}

const openEdit = (d: any) => {
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

const save = async () => {
  try {
    const payload: Record<string, any> = { ...form.value }
    if (!payload.starts_at) payload.starts_at = null
    if (!payload.ends_at) payload.ends_at = null
    if (payload.applies_to !== 'category') payload.category_id = null
    if (payload.applies_to !== 'product') payload.product_id = null

    if (editing.value) {
      await discountApi.update(editing.value.id, payload)
      success(t('common.save'))
    } else {
      await discountApi.create(payload)
      success(t('common.create'))
    }
    showForm.value = false
    await loadPage(1)
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  }
}

const remove = async (id: number) => {
  if (!confirm(t('common.confirm') + '?')) return
  try {
    await discountApi.remove(id)
    success(t('common.delete'))
    await loadPage(1)
  } catch {}
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader title="Discounts" subtitle="Manage promotional offers and seasonal pricing" action-label="CREATE DISCOUNT" @action="openCreate" />

    <div v-if="showForm" class="animate-in slide-in-from-top-4 duration-300">
      <Card class="max-w-2xl border-border/60 shadow-none bg-muted/5">
        <CardHeader class="pb-3 border-b border-border/40">
          <CardTitle class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {{ editing ? 'EDIT DISCOUNT' : 'NEW DISCOUNT' }}
          </CardTitle>
        </CardHeader>
        <CardContent class="p-6 space-y-6">
          <div class="space-y-1.5">
            <label class="text-[11px] font-medium text-foreground ml-0.5">Promotion Name</label>
            <Input v-model="form.name" placeholder="e.g. Summer Sale 2026" class="h-10" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">Type</label>
              <Select v-model="form.type" :options="typeOptions" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">Value ({{ form.type === 'percentage' ? '%' : 'Ks' }})</label>
              <Input v-model.number="form.value" type="number" min="0" class="h-10" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-medium text-foreground ml-0.5">Applies To</label>
            <Select v-model="form.applies_to" :options="appliesToOptions" />
          </div>

          <div v-if="form.applies_to !== 'all'" class="grid gap-6 animate-in fade-in slide-in-from-top-1">
            <div v-if="form.applies_to === 'category'" class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">Category</label>
              <Select v-model="form.category_id" :options="categoryOptions" />
            </div>
            <div v-if="form.applies_to === 'product'" class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">Product</label>
              <Select v-model="form.product_id" :options="productOptions" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">Start Date</label>
              <Input v-model="form.starts_at" type="date" class="h-10" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">End Date</label>
              <Input v-model="form.ends_at" type="date" class="h-10" />
            </div>
          </div>

          <div class="flex items-center gap-4 pt-2">
            <label class="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" v-model="form.is_active" class="size-4 rounded border-border text-primary focus:ring-primary/20 transition-all" />
              <span class="text-xs font-medium text-foreground group-hover:text-primary transition-colors">Mark as Active</span>
            </label>
          </div>

          <div class="flex items-center gap-3 pt-4 border-t">
            <Button size="sm" @click="save" class="h-9 px-8">SAVE DISCOUNT</Button>
            <Button variant="ghost" size="sm" @click="showForm = false" class="h-9">CANCEL</Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <LoadingSpinner v-if="loading" />

    <EmptyState v-else-if="discounts.length === 0" :icon="Tag" title="No active discounts found" />

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="d in discounts" :key="d.id" class="group hover:border-primary/40 transition-all shadow-none flex flex-col h-full overflow-hidden">
        <div class="p-5 flex-1 space-y-4">
          <div class="flex items-start justify-between">
            <div class="min-w-0">
              <h3 class="font-semibold text-sm truncate group-hover:text-primary transition-colors uppercase tracking-tight">{{ d.name }}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-2xl font-bold text-foreground tabular-nums">
                  {{ d.type === 'percentage' ? d.value + '%' : d.value.toLocaleString() }}
                </span>
                <span v-if="d.type !== 'percentage'" class="text-[10px] font-medium text-muted-foreground self-end mb-1">Ks</span>
              </div>
            </div>
            <Badge :variant="d.is_active ? 'success' : 'secondary'" class="h-5 px-1.5 text-[9px] font-medium uppercase tracking-wider">
              {{ d.is_active ? 'Active' : 'Paused' }}
            </Badge>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              <LayoutGrid class="size-3" />
              {{ d.applies_to }}
              <span v-if="d.applies_to === 'category' && d.category_id" class="text-foreground italic">
                ({{ categories.find((c: any) => c.id === d.category_id)?.name }})
              </span>
              <span v-if="d.applies_to === 'product' && d.product_id" class="text-foreground italic">
                ({{ products.find((p: any) => p.id === d.product_id)?.name }})
              </span>
            </div>
            <div v-if="d.starts_at || d.ends_at" class="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
              <Calendar class="size-3" />
              {{ d.starts_at || 'Anytime' }} — {{ d.ends_at || 'Indefinite' }}
            </div>
          </div>
        </div>

        <div class="p-4 bg-muted/10 border-t flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <Button variant="ghost" size="icon" class="size-8" @click="openEdit(d)">
            <Pencil class="size-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button variant="ghost" size="icon" class="size-8 text-destructive" @click="remove(d.id)">
            <Trash2 class="size-3.5" />
          </Button>
        </div>
      </Card>
    </div>

    <div class="pt-8">
      <Pagination :meta="meta" @page="loadPage" />
    </div>
  </div>
</template>

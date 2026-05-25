<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, Package } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import Pagination from '../components/Pagination.vue'
import { useNotify } from '../lib/notify'
import { firstError, formatFieldErrors } from '../lib/i18n-errors'

const { t } = useI18n()
const { success, error } = useNotify()

const categories = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const meta = ref<any>({})
const page = ref(1)

// Form
const showForm = ref(false)
const editing = ref<number | null>(null)
const name = ref('')
const description = ref('')
const fieldErrors = ref<any>(null)

async function load(p = 1) {
  loading.value = true
  page.value = p
  try {
    const { data } = await api.get('/categories', { params: { page: p } })
    categories.value = data.data
    meta.value = data.meta
  } catch {
    error(t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  name.value = ''
  description.value = ''
  fieldErrors.value = null
  showForm.value = true
}

function openEdit(cat: any) {
  editing.value = cat.id
  name.value = cat.name
  description.value = cat.description || ''
  fieldErrors.value = null
  showForm.value = true
}

async function save() {
  saving.value = true
  fieldErrors.value = null
  try {
    const payload = { name: name.value, description: description.value }
    if (editing.value) {
      await api.put(`/categories/${editing.value}`, payload)
    } else {
      await api.post('/categories', payload)
    }
    success(t('common.save'))
    showForm.value = false
    load(page.value)
  } catch (e: any) {
    if (e.response?.status === 422) {
      fieldErrors.value = e.response.data.errors
    } else {
      error(t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  if (!confirm(t('common.delete') + '?')) return
  try {
    await api.delete(`/categories/${id}`)
    success(t('common.delete'))
    load(page.value)
  } catch (e: any) {
    error(e.response?.data?.message || t('common.error'))
  }
}

onMounted(() => load(1))
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ t('categories.title') }}</h1>
        <p class="text-xs text-muted-foreground mt-1">Organize your inventory into manageable groups</p>
      </div>
      <Button size="sm" @click="openCreate">
        <Plus class="size-3.5 mr-2" /> {{ t('categories.new_category') }}
      </Button>
    </div>

    <div v-if="showForm" class="animate-in slide-in-from-top-4 duration-300">
      <Card class="max-w-xl border-border/60 shadow-none bg-muted/5">
        <CardHeader class="pb-3 border-b border-border/40">
          <CardTitle class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {{ editing ? 'EDIT CATEGORY' : 'NEW CATEGORY' }}
          </CardTitle>
        </CardHeader>
        <CardContent class="p-6 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label class="text-[10px] font-semibold text-muted-foreground uppercase ml-0.5">{{ t('categories.name') }}</label>
              <Input v-model="name" class="h-9 text-xs" />
              <p v-if="firstError(fieldErrors, 'name')" class="text-[10px] text-destructive ml-0.5">{{ firstError(fieldErrors, 'name') }}</p>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-semibold text-muted-foreground uppercase ml-0.5">{{ t('categories.description') }}</label>
              <Input v-model="description" class="h-9 text-xs" />
            </div>
          </div>
          <div class="flex items-center gap-3 pt-2">
            <Button size="sm" :disabled="saving" @click="save" class="h-8 px-6 text-[10px] font-semibold">
              {{ saving ? 'SAVING...' : t('common.save').toUpperCase() }}
            </Button>
            <Button variant="ghost" size="sm" @click="showForm = false" class="h-8 text-[10px] font-semibold">
              {{ t('common.cancel').toUpperCase() }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="loading" class="flex h-64 items-center justify-center text-muted-foreground">
      <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else-if="categories.length === 0" class="py-20 text-center border rounded-xl border-dashed">
      <Package class="size-10 mx-auto text-muted-foreground/20 mb-4" />
      <p class="text-sm font-medium text-muted-foreground">{{ t('common.no_data') }}</p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card v-for="cat in categories" :key="cat.id" class="group hover:border-primary/40 transition-all shadow-none">
        <CardContent class="p-5 flex items-center justify-between">
          <div class="min-w-0">
            <h3 class="font-semibold text-sm truncate group-hover:text-primary transition-colors">{{ cat.name }}</h3>
            <p class="text-[10px] text-muted-foreground mt-1">{{ cat.products_count }} Products</p>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <Button variant="ghost" size="icon" class="size-7 rounded-full" @click="openEdit(cat)">
              <Pencil class="size-3 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button variant="ghost" size="icon" class="size-7 rounded-full text-destructive" @click="remove(cat.id)">
              <Trash2 class="size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    
    <div class="pt-8">
      <Pagination :meta="meta" @page="load" />
    </div>
  </div>
</template>

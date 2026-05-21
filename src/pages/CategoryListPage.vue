<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import { useNotify } from '../lib/notify'
import { firstError, formatFieldErrors } from '../lib/i18n-errors'
import Pagination from '../components/Pagination.vue'
import type { Category } from '../types'

const { t } = useI18n()
const { success, error: toastError } = useNotify()
const categories = ref<Category[]>([])
const meta = ref<any>(null)
const showForm = ref(false)
const editing = ref<Category | null>(null)
const name = ref('')
const description = ref('')
const loading = ref(true)
const fieldErrors = ref<Record<string, string[]> | null>(null)
const saving = ref(false)

async function loadPage(page = 1) {
  loading.value = true
  try {
    const { data } = await api.get('/categories', { params: { page } })
    categories.value = data.data
    meta.value = { current_page: data.meta.current_page, last_page: data.meta.last_page, total: data.meta.total, per_page: data.meta.per_page }
  } catch (e: any) {
    toastError(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage())

function openCreate() {
  editing.value = null
  name.value = ''
  description.value = ''
  showForm.value = true
  fieldErrors.value = null
}

function openEdit(cat: Category) {
  editing.value = cat
  name.value = cat.name
  description.value = cat.description || ''
  showForm.value = true
  fieldErrors.value = null
}

async function save() {
  saving.value = true
  fieldErrors.value = null
  try {
    if (editing.value) {
      await api.put(`/categories/${editing.value.id}`, { name: name.value, description: description.value })
      success(t('common.save') + ' ✅')
    } else {
      await api.post('/categories', { name: name.value, description: description.value })
      success(t('common.create') + ' ✅')
    }
    showForm.value = false
    await loadPage(1)
  } catch (e: any) {
    if (e?.response?.data?.errors) {
      fieldErrors.value = e.response.data.errors
    } else {
      toastError(e?.response?.data?.message || t('common.error'))
    }
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  if (!confirm(t('common.confirm') + '?')) return
  try {
    await api.delete(`/categories/${id}`)
    categories.value = categories.value.filter((c) => c.id !== id)
    success(t('common.delete') + ' ✅')
  } catch (e: any) {
    toastError(e?.response?.data?.message || t('common.error'))
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('categories.title') }}</h1>
      <Button @click="openCreate" class="w-full sm:w-auto"><Plus class="size-4" /> {{ t('categories.new_category') }}</Button>
    </div>

    <div v-if="loading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

    <Card v-if="showForm" class="max-w-md">
      <CardContent class="space-y-4 p-4">
        <div class="space-y-1.5">
          <Input v-model="name" :placeholder="t('categories.name')"
            :class="firstError(fieldErrors, 'name') ? 'border-red-400 dark:border-red-500 focus-visible:ring-red-400' : ''" />
          <p v-if="firstError(fieldErrors, 'name')" class="text-xs text-red-500 dark:text-red-400">{{ firstError(fieldErrors, 'name') }}</p>
        </div>
        <div class="space-y-1.5">
          <Input v-model="description" :placeholder="t('categories.description')" />
        </div>
        <div class="flex gap-2">
          <Button :disabled="saving" @click="save">{{ saving ? t('common.loading') : t('common.save') }}</Button>
          <Button variant="outline" @click="showForm = false">{{ t('common.cancel') }}</Button>
        </div>
        <div v-if="fieldErrors && !firstError(fieldErrors, 'name')" class="text-xs text-red-500 dark:text-red-400 space-y-0.5">
          <p v-for="fe in formatFieldErrors(fieldErrors)" :key="fe.label">{{ fe.label }}: {{ fe.messages.join(', ') }}</p>
        </div>
      </CardContent>
    </Card>

    <p v-if="!loading && showForm === false && categories.length === 0" class="text-sm text-zinc-400 dark:text-zinc-500 py-8 text-center">{{ t('common.no_data') }}</p>

    <div v-if="categories.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="cat in categories" :key="cat.id" class="transition-shadow hover:shadow-md">
        <CardContent class="flex items-center justify-between p-4">
          <div class="min-w-0">
            <p class="font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ cat.name }}</p>
            <p class="text-xs text-zinc-400 dark:text-zinc-500">{{ cat.products_count }} {{ t('categories.products_count') }}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" @click="openEdit(cat)"><Pencil class="size-4" /></Button>
            <Button variant="ghost" size="icon" @click="remove(cat.id)" class="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400"><Trash2 class="size-4" /></Button>
          </div>
        </CardContent>
      </Card>
    </div>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

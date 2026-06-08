<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, Package } from 'lucide-vue-next'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import Pagination from '../components/Pagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
import PageHeader from '../components/PageHeader.vue'
import { useNotify } from '../lib/notify'
import { firstError } from '../lib/i18n-errors'
import { useListing } from '../composables'
import { useCategoryApi } from '../composables/api'

const { t } = useI18n()
const { success, error } = useNotify()
const categoryApi = useCategoryApi()
const { items: categories, meta, loading, loadPage } = useListing<any>('/categories')

const showForm = ref(false)
const editing = ref<number | null>(null)
const name = ref('')
const description = ref('')
const fieldErrors = ref<any>(null)
const saving = ref(false)

const openCreate = () => {
  editing.value = null
  name.value = ''
  description.value = ''
  fieldErrors.value = null
  showForm.value = true
}

const openEdit = (cat: any) => {
  editing.value = cat.id
  name.value = cat.name
  description.value = cat.description || ''
  fieldErrors.value = null
  showForm.value = true
}

const save = async () => {
  saving.value = true
  fieldErrors.value = null
  try {
    const payload = { name: name.value, description: description.value }
    if (editing.value) {
      await categoryApi.update(editing.value, payload)
    } else {
      await categoryApi.create(payload)
    }
    success(t('common.save'))
    showForm.value = false
    loadPage(meta.value?.current_page || 1)
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

const remove = async (id: number) => {
  if (!confirm(t('common.delete') + '?')) return
  try {
    await categoryApi.remove(id)
    success(t('common.delete'))
    loadPage(meta.value?.current_page || 1)
  } catch (e: any) {
    error(e.response?.data?.message || t('common.error'))
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader title="Categories" subtitle="Organize your inventory into manageable groups" action-label="New Category" @action="openCreate" />

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

    <LoadingSpinner v-if="loading" />

    <EmptyState v-else-if="categories.length === 0" :icon="Package" :title="t('common.no_data')" />

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
      <Pagination :meta="meta" @page="loadPage" />
    </div>
  </div>
</template>

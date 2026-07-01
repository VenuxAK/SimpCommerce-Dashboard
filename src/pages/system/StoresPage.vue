<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { useNotify } from '../../lib/notify'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import PageHeader from '../../components/PageHeader.vue'
import { useListing } from '../../composables'
import { useStoreApi } from '../../composables/api'

const { t } = useI18n()
const { success, error } = useNotify()
const storeApi = useStoreApi()
const { items: stores, loading, loadPage } = useListing<any>('/stores')

const showForm = ref(false)
const editing = ref<any | null>(null)
const form = ref({ name: '', slug: '', description: '', is_active: true })
const saving = ref(false)

const openCreate = () => {
  editing.value = null
  form.value = { name: '', slug: '', description: '', is_active: true }
  showForm.value = true
}

const openEdit = (s: any) => {
  editing.value = s
  form.value = { name: s.name, slug: s.slug, description: s.description || '', is_active: s.is_active ?? true }
  showForm.value = true
}

const save = async () => {
  saving.value = true
  try {
    if (editing.value) {
      await storeApi.update(editing.value.id, form.value)
    } else {
      await storeApi.create(form.value)
    }
    success('Store saved.')
    showForm.value = false
    await loadPage(1)
  } catch (e: any) {
    error(e?.response?.data?.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

const remove = async (id: number) => {
  if (!confirm('Delete this store?')) return
  try {
    await storeApi.remove(id)
    stores.value = stores.value.filter((s: any) => s.id !== id)
    success('Store deleted.')
  } catch {}
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader :title="t('stores.title')" :action-label="t('stores.create_store')" @action="openCreate" />

    <div v-if="showForm" class="rounded-lg border bg-muted/5 p-5 space-y-4 max-w-lg">
      <input v-model="form.name" :placeholder="t('stores.store_name')" class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs" />
      <input v-model="form.slug" :placeholder="t('common.slug')" class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs" />
      <input v-model="form.description" :placeholder="t('common.description')" class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs" />
      <label class="flex items-center gap-3 cursor-pointer group select-none">
        <div class="relative flex items-center">
          <input type="checkbox" v-model="form.is_active" class="sr-only peer" :disabled="form.slug === 'main'" />
          <div class="w-9 h-5 bg-muted border border-input rounded-full peer peer-focus:ring-2 peer-focus:ring-green-500/20 peer-checked:bg-green-500 peer-checked:border-green-500 transition-colors duration-300" :class="{ 'opacity-50 cursor-not-allowed': form.slug === 'main' }"></div>
          <div class="absolute left-[3px] top-[3px] bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 peer-checked:translate-x-4 shadow-sm"></div>
        </div>
        <span class="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {{ form.is_active ? 'Store is Active' : 'Store is Inactive' }}
          <span v-if="form.slug === 'main'" class="text-[9px] text-orange-500 ml-1">(Main store cannot be inactive)</span>
        </span>
      </label>
      <div class="flex gap-2">
        <Button size="sm" :disabled="saving" @click="save">{{ editing ? t('common.edit') : t('common.create') }}</Button>
        <Button variant="ghost" size="sm" @click="showForm = false">{{ t('common.cancel') }}</Button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="s in stores" :key="s.id" class="shadow-none">
        <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
          <div class="flex items-center gap-2">
            <CardTitle class="text-sm font-medium">{{ s.name }}</CardTitle>
            <Badge :variant="s.is_active ? 'default' : 'secondary'" :class="`${s.is_active ? 'bg-green-500 hover:bg-green-600 border-transparent text-white' : ''} text-[9px] uppercase h-5 leading-none px-1.5`">{{ s.is_active ? 'Active' : 'Inactive' }}</Badge>
          </div>
          <Badge variant="outline" class="text-[10px]">{{ s.slug }}</Badge>
        </CardHeader>
        <CardContent class="p-4 flex items-center justify-between">
          <p class="text-xs text-muted-foreground">{{ s.description || '—' }}</p>
          <div class="flex gap-1">
            <button @click="openEdit(s)" class="p-1.5 rounded hover:bg-accent text-muted-foreground"><Pencil class="size-3.5" /></button>
            <button @click="remove(s.id)" class="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 class="size-3.5" /></button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

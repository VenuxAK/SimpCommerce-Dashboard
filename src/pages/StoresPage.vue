<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useNotify } from '../lib/notify'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import PageHeader from '../components/PageHeader.vue'
import { useListing } from '../composables'

const { t } = useI18n()
const { success, error } = useNotify()
const { items: stores, loading, loadPage } = useListing<any>('/stores')

const showForm = ref(false)
const editing = ref<any | null>(null)
const form = ref({ name: '', slug: '', description: '' })
const saving = ref(false)

function openCreate() {
  editing.value = null
  form.value = { name: '', slug: '', description: '' }
  showForm.value = true
}

function openEdit(s: any) {
  editing.value = s
  form.value = { name: s.name, slug: s.slug, description: s.description || '' }
  showForm.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value) {
      await api.put(`/stores/${editing.value.id}`, form.value)
    } else {
      await api.post('/stores', form.value)
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

async function remove(id: number) {
  if (!confirm('Delete this store?')) return
  try {
    await api.delete(`/stores/${id}`)
    stores.value = stores.value.filter((s: any) => s.id !== id)
    success('Store deleted.')
  } catch {}
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader title="Stores" action-label="Create Store" @action="openCreate" />

    <div v-if="showForm" class="rounded-lg border bg-muted/5 p-5 space-y-4 max-w-lg">
      <input v-model="form.name" placeholder="Store name" class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs" />
      <input v-model="form.slug" placeholder="Slug" class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs" />
      <input v-model="form.description" placeholder="Description" class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs" />
      <div class="flex gap-2">
        <Button size="sm" :disabled="saving" @click="save">{{ editing ? 'Update' : 'Create' }}</Button>
        <Button variant="ghost" size="sm" @click="showForm = false">Cancel</Button>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="s in stores" :key="s.id" class="shadow-none">
        <CardHeader class="flex flex-row items-center justify-between py-3 px-5 border-b">
          <CardTitle class="text-sm font-medium">{{ s.name }}</CardTitle>
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

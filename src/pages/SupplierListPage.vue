<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import { Badge } from '../components/ui/badge'
import { useNotify } from '../lib/notify'
import Pagination from '../components/Pagination.vue'
import PageHeader from '../components/PageHeader.vue'
import { useListing } from '../composables'
import { useSupplierApi } from '../composables/api'
import type { Supplier } from '../types'

const { t } = useI18n()
const { success, error } = useNotify()
const supplierApi = useSupplierApi()
const { items: suppliers, meta, loading, loadPage } = useListing<Supplier>('/suppliers')

const showForm = ref(false)
const editing = ref<Supplier | null>(null)
const form = ref({ name: '', contact_person: '', phone: '', email: '', address: '', notes: '' })

const openCreate = () => {
  editing.value = null
  form.value = { name: '', contact_person: '', phone: '', email: '', address: '', notes: '' }
  showForm.value = true
}

const openEdit = (s: Supplier) => {
  editing.value = s
  form.value = {
    name: s.name, contact_person: s.contact_person || '',
    phone: s.phone || '', email: s.email || '',
    address: s.address || '', notes: s.notes || '',
  }
  showForm.value = true
}

const save = async () => {
  try {
    if (editing.value) {
      await supplierApi.update(editing.value.id, form.value)
      success(t('common.save') + ' ✅')
    } else {
      await supplierApi.create(form.value)
      success(t('common.create') + ' ✅')
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
    await supplierApi.remove(id)
    suppliers.value = suppliers.value.filter((s: any) => s.id !== id)
    success(t('common.delete') + ' ✅')
  } catch { }
}
</script>

<template>
  <div class="space-y-4 animate-in fade-in duration-700">
    <PageHeader :title="t('nav.suppliers')" :subtitle="t('suppliers.manage')" :action-label="t('common.create')" @action="openCreate" />

    <div v-if="loading" class="text-sm text-muted-foreground">{{ t('common.loading') }}</div>

    <Card v-if="showForm" class="max-w-lg">
      <CardHeader><CardTitle>{{ editing ? t('common.edit') : t('common.create') }}</CardTitle></CardHeader>
      <CardContent class="space-y-3">
        <Input v-model="form.name" :placeholder="t('validation.name')" />
        <Input v-model="form.contact_person" :placeholder="t('validation.contact_person')" />
        <div class="grid grid-cols-2 gap-3">
          <Input v-model="form.phone" :placeholder="t('customers.phone')" />
          <Input v-model="form.email" type="email" :placeholder="t('customers.email')" />
        </div>
        <Input v-model="form.address" :placeholder="t('customers.address')" />
        <Input v-model="form.notes" :placeholder="t('common.notes')" />
        <div class="flex gap-2">
          <Button @click="save">{{ t('common.save') }}</Button>
          <Button variant="outline" @click="showForm = false">{{ t('common.cancel') }}</Button>
        </div>
      </CardContent>
    </Card>

    <div v-if="!loading && suppliers.length === 0" class="text-sm text-muted-foreground py-8 text-center">{{ t('validation.no_suppliers') }}</div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="s in suppliers" :key="s.id" class="transition-shadow hover:shadow-md">
        <CardContent class="p-4">
          <div class="flex items-start justify-between">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-foreground truncate">{{ s.name }}</p>
              <p v-if="s.contact_person" class="text-xs text-muted-foreground">{{ s.contact_person }}</p>
              <p v-if="s.phone" class="text-xs text-muted-foreground">{{ s.phone }}</p>
              <p v-if="s.products_count !== undefined" class="text-xs text-muted-foreground mt-1">{{ s.products_count }} {{ t('products.title') }}</p>
            </div>
            <div class="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" @click="openEdit(s)"><Pencil class="size-4" /></Button>
              <Button variant="ghost" size="icon" @click="remove(s.id)" class="text-red-400"><Trash2 class="size-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    <Pagination :meta="meta" @page="loadPage" />
  </div>
</template>

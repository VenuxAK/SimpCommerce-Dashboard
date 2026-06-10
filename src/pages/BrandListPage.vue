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
import { useBrandApi } from '../composables/api'
import api from '../lib/axios'

const { t } = useI18n()
const { success, error } = useNotify()
const brandApi = useBrandApi()
const { items: brands, meta, loading, loadPage } = useListing<any>('/brands')

const showForm = ref(false)
const editing = ref<number | null>(null)
const name = ref('')
const logoUrl = ref<string | null>(null)
const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const fieldErrors = ref<any>(null)
const saving = ref(false)

const openCreate = () => {
  editing.value = null
  name.value = ''
  logoUrl.value = null
  logoFile.value = null
  logoPreview.value = null
  fieldErrors.value = null
  showForm.value = true
}

const openEdit = (cat: any) => {
  editing.value = cat.id
  name.value = cat.name
  logoUrl.value = cat.logo_url || null
  logoFile.value = null
  logoPreview.value = null
  fieldErrors.value = null
  showForm.value = true
}

const onLogoChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  logoFile.value = target.files[0]
  const reader = new FileReader()
  reader.onload = () => { logoPreview.value = reader.result as string }
  reader.readAsDataURL(target.files[0])
}

const save = async () => {
  saving.value = true
  fieldErrors.value = null
  try {
    const payload = { name: name.value }
    let brandId: number
    if (editing.value) {
      await brandApi.update(editing.value, payload)
      brandId = editing.value
    } else {
      const res = await brandApi.create(payload)
      brandId = res.data.data.id
    }

    if (logoFile.value) {
      const fd = new FormData()
      fd.append('logo', logoFile.value)
      await api.post(`/brands/${brandId}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
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
    await brandApi.remove(id)
    success(t('common.delete'))
    loadPage(meta.value?.current_page || 1)
  } catch (e: any) {
    error(e.response?.data?.message || t('common.error'))
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-700">
    <PageHeader title="Brands" subtitle="Manage your product brands" action-label="New Brand" @action="openCreate" />

    <div v-if="showForm" class="animate-in slide-in-from-top-4 duration-300">
      <Card class="max-w-xl border-border/60 shadow-none bg-muted/5">
        <CardHeader class="pb-3 border-b border-border/40">
          <CardTitle class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {{ editing ? 'EDIT BRAND' : 'NEW BRAND' }}
          </CardTitle>
        </CardHeader>
        <CardContent class="p-6 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-1.5">
              <label class="text-[10px] font-semibold text-muted-foreground uppercase ml-0.5">{{ t('brands.name') }}</label>
              <Input v-model="name" class="h-9 text-xs" />
              <p v-if="firstError(fieldErrors, 'name')" class="text-[10px] text-destructive ml-0.5">{{ firstError(fieldErrors, 'name') }}</p>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-semibold text-muted-foreground uppercase ml-0.5">{{ t('brands.logo') }}</label>
              <div class="flex items-center gap-3">
                <div class="size-9 rounded border border-border/60 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" />
                  <img v-else-if="logoUrl" :src="logoUrl" class="w-full h-full object-cover" />
                  <span v-else class="text-[10px] font-bold text-muted-foreground">{{ name.charAt(0) || '?' }}</span>
                </div>
                <input type="file" accept="image/*" @change="onLogoChange" class="flex-1 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all text-muted-foreground" />
              </div>
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

    <EmptyState v-else-if="brands.length === 0" :icon="Package" :title="t('common.no_data')" />

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Card v-for="brand in brands" :key="brand.id" class="group hover:border-primary/40 transition-all shadow-none">
        <CardContent class="p-5 flex items-center justify-between">
          <div class="flex items-center gap-3 min-w-0">
            <div class="size-10 rounded border bg-white flex items-center justify-center shrink-0 p-1">
              <img v-if="brand.logo_url" :src="brand.logo_url" class="max-h-full max-w-full object-contain" />
              <span v-else class="text-xs font-bold text-muted-foreground">{{ brand.name.charAt(0) }}</span>
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-sm truncate group-hover:text-primary transition-colors">{{ brand.name }}</h3>
              <p class="text-[10px] text-muted-foreground mt-1">{{ brand.products_count }} Products</p>
            </div>
          </div>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <Button variant="ghost" size="icon" class="size-7 rounded-full" @click="openEdit(brand)">
              <Pencil class="size-3 text-muted-foreground hover:text-foreground" />
            </Button>
            <Button variant="ghost" size="icon" class="size-7 rounded-full text-destructive" @click="remove(brand.id)">
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

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, Package, Image as ImageIcon } from 'lucide-vue-next'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import Input from '../../components/ui/Input.vue'
import Pagination from '../../components/Pagination.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import PageHeader from '../../components/PageHeader.vue'
import { useNotify } from '../../lib/notify'
import { firstError } from '../../lib/i18n-errors'
import { useListing } from '../../composables'
import { useCategoryApi } from '../../composables/api'

const { t } = useI18n()
const { success, error } = useNotify()
const categoryApi = useCategoryApi()
const { items: categories, meta, loading, loadPage } = useListing<any>('/categories')

const showForm = ref(false)
const editing = ref<number | null>(null)
const name = ref('')
const description = ref('')
const parentId = ref<number | null>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const fieldErrors = ref<any>(null)
const saving = ref(false)
const storageUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return null
  return imagePath.startsWith('http') ? imagePath : `${storageUrl}/storage/${imagePath}`
}

const onImageSelected = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    imageFile.value = target.files[0]
    const reader = new FileReader()
    reader.onload = () => { imagePreview.value = reader.result as string }
    reader.readAsDataURL(imageFile.value)
  }
}

const openCreate = () => {
  editing.value = null
  name.value = ''
  description.value = ''
  parentId.value = null
  imageFile.value = null
  imagePreview.value = null
  fieldErrors.value = null
  showForm.value = true
}

const openEdit = (cat: any) => {
  editing.value = cat.id
  name.value = cat.name
  description.value = cat.description || ''
  parentId.value = cat.parent_id || null
  imageFile.value = null
  imagePreview.value = getImageUrl(cat.image)
  fieldErrors.value = null
  showForm.value = true
}

const save = async () => {
  saving.value = true
  fieldErrors.value = null
  try {
      const payload = { name: name.value, description: description.value, parent_id: parentId.value }
      let categoryId = editing.value
      if (editing.value) {
        await categoryApi.update(editing.value, payload)
      } else {
        const res = await categoryApi.create(payload)
        categoryId = res.data.data.id
      }
      
      if (imageFile.value && categoryId) {
        const fd = new FormData()
        fd.append('image', imageFile.value)
        await categoryApi.uploadImage(categoryId, fd)
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
    <PageHeader :title="t('categories.title')" :subtitle="t('categories.manage')" :action-label="t('categories.new_category')" @action="openCreate" />

    <div v-if="showForm" class="animate-in slide-in-from-top-4 duration-300">
      <Card class="max-w-xl border-border/60 shadow-none bg-muted/5">
        <CardHeader class="pb-3 border-b border-border/40">
          <CardTitle class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {{ editing ? t('categories.edit_category').toUpperCase() : t('categories.new_category').toUpperCase() }}
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
            <div class="space-y-1.5 sm:col-span-2">
              <label class="text-[10px] font-semibold text-muted-foreground uppercase ml-0.5">{{ t('categories.parent_category') }}</label>
              <select v-model="parentId" class="w-full rounded-md border border-input bg-background px-3 h-9 text-xs shadow-sm">
                <option :value="null">{{ t('categories.top_level') }}</option>
                <option v-for="c in categories.filter((cat: any) => cat.id !== editing && !cat.parent_id)" :key="c.id" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            
            <div class="space-y-1.5 sm:col-span-2">
              <label class="text-[10px] font-semibold text-muted-foreground uppercase ml-0.5">Image</label>
              <div class="flex items-center gap-4">
                <div v-if="imagePreview" class="relative group shrink-0">
                  <img :src="imagePreview" class="size-16 rounded-md border object-cover" />
                  <button @click="imagePreview = null; imageFile = null" class="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 class="size-3" />
                  </button>
                </div>
                <div v-else class="size-16 rounded-md border border-dashed flex items-center justify-center shrink-0 bg-muted/30">
                  <ImageIcon class="size-6 text-muted-foreground/50" />
                </div>
                <label class="cursor-pointer">
                  <span class="text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 px-3 py-1.5 rounded-md transition-colors">
                    {{ imagePreview ? 'Change Image' : 'Select Image' }}
                  </span>
                  <input type="file" accept="image/*" class="hidden" @change="onImageSelected" />
                </label>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3 pt-2">
            <Button size="sm" :disabled="saving" @click="save" class="h-8 px-6 text-[10px] font-semibold">
              {{ saving ? t('common.saving').toUpperCase() : t('common.save').toUpperCase() }}
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
        <CardContent class="p-5 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="size-10 shrink-0 rounded border bg-muted flex items-center justify-center overflow-hidden">
              <img v-if="cat.image" :src="getImageUrl(cat.image)!" class="size-full object-cover" />
              <ImageIcon v-else class="size-4 text-muted-foreground/50" />
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                <span v-if="cat.parent_id" class="text-muted-foreground mr-1">↳</span>{{ cat.name }}
              </h3>
              <p class="text-[10px] text-muted-foreground mt-1">{{ cat.products_count }} {{ t('categories.products_count') }}</p>
            </div>
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

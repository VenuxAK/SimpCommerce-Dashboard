<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { Plus, X, AlertCircle, Upload, ChevronLeft, Check } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import { useNotify } from '../lib/notify'
import { firstError, formatFieldErrors } from '../lib/i18n-errors'
import type { Category, Product } from '../types'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const { success, error: toastError } = useNotify()
const isEdit = route.name === 'product-edit'
const saving = ref(false)

const categories = ref<Category[]>([])
const suppliers = ref<any[]>([])
const fieldErrors = ref<Record<string, string[]> | null>(null)

interface VariantForm {
  sku: string; size: string; color: string
  price_adjustment: number; purchase_price: number | null; stock_quantity: number
  image: string | null
  image_file: File | null
  image_preview: string | null
}
const form = ref({
  category_id: null as number | null,
  supplier_id: null as number | null,
  name: '',
  description: '',
  base_price: 0,
  image: null as string | null,
  image_file: null as File | null,
  image_preview: null as string | null,
  variants: [] as VariantForm[],
})

const categoryOptions = computed(() => [
  { label: 'SELECT CATEGORY', value: '' },
  ...(categories.value || []).map(c => ({ label: c.name.toUpperCase(), value: c.id }))
])

const supplierOptions = computed(() => [
  { label: 'SELECT SUPPLIER', value: '' },
  ...(suppliers.value || []).map(s => ({ label: s.name.toUpperCase(), value: s.id }))
])

const storageUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '')

const imageUrl = computed(() => {
  if (form.value.image_preview) return form.value.image_preview
  const img = form.value.image
  if (!img) return null
  return img.startsWith('http') ? img : `${storageUrl}/storage/${img}`
})

function variantImageUrl(v: VariantForm): string | null {
  if (v.image_preview) return v.image_preview
  if (!v.image) return null
  return v.image.startsWith('http') ? v.image : `${storageUrl}/storage/${v.image}`
}

onMounted(async () => {
  try {
    const { data: catRes } = await api.get('/categories')
    categories.value = catRes.data
  } catch {}

  try {
    const { data: supRes } = await api.get('/suppliers')
    suppliers.value = supRes.data.data
  } catch {}

  if (isEdit) {
    try {
      const { data } = await api.get(`/products/${route.params.id}`)
      const p = data.data as Product
      form.value = {
        category_id: p.category_id,
        supplier_id: p.supplier_id ?? null,
        name: p.name,
        description: p.description || '',
        base_price: p.base_price,
        image: p.image,
        image_file: null,
        image_preview: p.image_url || null,
        variants: p.variants.map((v) => ({
          sku: v.sku, size: v.size || '', color: v.color || '',
          price_adjustment: v.price_adjustment, purchase_price: v.purchase_price, stock_quantity: v.stock_quantity,
          image: v.image, image_file: null, image_preview: v.image_url || null,
        })),
      }
    } catch (e: any) {
      toastError(e?.response?.data?.message || t('dashboard.load_failed'))
    }
  }
})

function onProductImage(e: Event) {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  form.value.image_file = target.files[0]
  const reader = new FileReader()
  reader.onload = () => { form.value.image_preview = reader.result as string }
  reader.readAsDataURL(target.files[0])
}

function onVariantImage(e: Event, idx: number) {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  const v = form.value.variants[idx]
  v.image_file = target.files[0]
  const reader = new FileReader()
  reader.onload = () => { v.image_preview = reader.result as string }
  reader.readAsDataURL(target.files[0])
}

function addVariant() {
  form.value.variants.push({
    sku: '', size: '', color: '', price_adjustment: 0, purchase_price: null, stock_quantity: 0,
    image: null, image_file: null, image_preview: null,
  })
}

function removeVariant(idx: number) {
  form.value.variants.splice(idx, 1)
}

function variantError(field: string, idx: number): string | null {
  const key = `variants.${idx}.${field}`
  return fieldErrors.value?.[key] ? firstError(fieldErrors.value, key) : null
}

async function save() {
  saving.value = true
  fieldErrors.value = null
  try {
    let productId: number
    const payload = {
      category_id: form.value.category_id,
      name: form.value.name,
      description: form.value.description,
      base_price: form.value.base_price,
      supplier_id: form.value.supplier_id,
      variants: form.value.variants.map((v) => ({
        sku: v.sku, size: v.size, color: v.color,
        price_adjustment: v.price_adjustment, purchase_price: v.purchase_price, stock_quantity: v.stock_quantity,
      })),
    }

    if (isEdit) {
      await api.put(`/products/${route.params.id}`, payload)
      productId = Number(route.params.id)
    } else {
      const res = await api.post('/products', payload)
      productId = res.data.data.id
    }

    if (form.value.image_file) {
      const fd = new FormData()
      fd.append('image', form.value.image_file)
      await api.post(`/products/${productId}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    }

    const savedVariants = (await api.get(`/products/${productId}`)).data.data.variants
    for (let i = 0; i < form.value.variants.length; i++) {
      const v = form.value.variants[i]
      if (v.image_file && savedVariants[i]) {
        const fd = new FormData()
        fd.append('image', v.image_file)
        await api.post(`/variants/${savedVariants[i].id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
    }

    success(t('common.save') + ' ✅')
    router.push('/products')
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
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-500">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="router.back()" class="size-8">
        <ChevronLeft class="size-4" />
      </Button>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ isEdit ? t('products.edit_product') : t('products.new_product') }}</h1>
        <p class="text-xs text-muted-foreground mt-1">Provide detailed information for your inventory item</p>
      </div>
    </div>

    <div v-if="fieldErrors && Object.keys(fieldErrors).length" class="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <AlertCircle class="size-4 text-destructive shrink-0 mt-0.5" />
      <div class="text-[11px] text-destructive space-y-1">
        <p v-for="fe in formatFieldErrors(fieldErrors)" :key="fe.label">
          <span class="font-bold uppercase">{{ fe.label }}:</span> {{ fe.messages.join(', ') }}
        </p>
      </div>
    </div>

    <div class="grid gap-8">
      <Card class="shadow-none">
        <CardHeader class="border-b bg-muted/10 py-3 px-6"><CardTitle class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{{ t('common.details') }}</CardTitle></CardHeader>
        <CardContent class="p-6 space-y-6">
          <div class="space-y-1.5">
            <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('products.product_name') }}</label>
            <Input v-model="form.name" class="h-10" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('products.category') }}</label>
              <Select v-model="form.category_id" :options="categoryOptions" />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('nav.suppliers') }}</label>
              <Select v-model="form.supplier_id" :options="supplierOptions" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('products.base_price') }} (Ks)</label>
            <Input v-model.number="form.base_price" type="number" min="0" class="h-10" />
          </div>

          <div class="space-y-3">
            <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('products.image') }}</label>
            <div class="flex items-center gap-6 p-4 rounded-lg border border-dashed bg-muted/5">
              <div v-if="imageUrl" class="relative group shrink-0">
                <img :src="imageUrl" class="size-20 rounded-md border object-cover transition-all" />
                <button @click="form.image_preview = null; form.image_file = null; form.image = null" class="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <X class="size-3" />
                </button>
              </div>
              <div v-else class="size-20 rounded-md border bg-muted flex items-center justify-center opacity-20 shrink-0">
                <Upload class="size-6" />
              </div>
              <div class="flex-1">
                <p class="text-xs font-medium text-foreground">Featured Image</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG or WebP. Max 2MB.</p>
                <label class="mt-3 inline-flex items-center px-3 py-1.5 rounded border bg-background hover:bg-accent text-[10px] font-medium cursor-pointer transition-all">
                  {{ imageUrl ? 'Change Image' : 'Select Image' }}
                  <input type="file" accept="image/*" class="hidden" @change="onProductImage" />
                </label>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] font-medium text-foreground ml-0.5">{{ t('common.description') }}</label>
            <textarea v-model="form.description"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] transition-all" rows="4" />
          </div>
        </CardContent>
      </Card>

      <Card class="shadow-none">
        <CardHeader class="flex flex-row items-center justify-between border-b bg-muted/10 py-3 px-6">
          <CardTitle class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{{ t('products.variants') }}</CardTitle>
          <Button variant="outline" size="sm" @click="addVariant" class="h-7 text-[10px]"><Plus class="size-3 mr-1" /> ADD VARIANT</Button>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="form.variants.length === 0" class="py-12 text-center text-xs text-muted-foreground italic">
            No variants defined. Add at least one variant.
          </div>
          <div v-else class="divide-y">
            <div v-for="(v, idx) in form.variants" :key="idx" class="p-6 space-y-4 hover:bg-muted/5 transition-colors relative group">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-primary tracking-widest uppercase">Variant #{{ idx + 1 }}</span>
                <button @click="removeVariant(idx)" class="text-muted-foreground hover:text-destructive transition-colors"><X class="size-4" /></button>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div class="space-y-1 sm:col-span-2 lg:col-span-1">
                  <label class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">SKU</label>
                  <Input v-model="v.sku" class="h-8 text-xs" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Size</label>
                  <Input v-model="v.size" class="h-8 text-xs" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Color</label>
                  <Input v-model="v.color" class="h-8 text-xs" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Adj.</label>
                  <Input v-model.number="v.price_adjustment" type="number" class="h-8 text-xs" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cost</label>
                  <Input :model-value="v.purchase_price ?? ''" @update:model-value="v.purchase_price = $event === '' ? null : Number($event)" type="number" min="0" class="h-8 text-xs" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Stock</label>
                  <Input v-model.number="v.stock_quantity" type="number" min="0" class="h-8 text-xs" />
                </div>
              </div>

              <div class="flex items-center gap-4">
                <div v-if="variantImageUrl(v)" class="size-10 rounded border overflow-hidden shrink-0">
                  <img :src="variantImageUrl(v)!" class="size-full object-cover" />
                </div>
                <label class="inline-flex items-center px-2 py-1 rounded border bg-background hover:bg-accent text-[9px] font-medium cursor-pointer transition-all">
                  <Upload class="size-3 mr-1.5" /> {{ v.image_preview ? 'Change' : 'Variant Image' }}
                  <input type="file" accept="image/*" class="hidden" @change="onVariantImage($event, idx)" />
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="flex items-center justify-end gap-3 pt-6 border-t">
      <Button variant="ghost" size="sm" @click="router.back()">{{ t('common.cancel') }}</Button>
      <Button size="sm" :disabled="saving" @click="save" class="h-9 px-8">
        <Check v-if="!saving" class="size-3.5 mr-2" />
        {{ saving ? 'Saving...' : t('common.save') }}
      </Button>
    </div>
  </div>
</template>

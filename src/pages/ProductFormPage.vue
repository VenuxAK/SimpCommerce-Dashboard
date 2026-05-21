<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { Plus, X, AlertCircle, Upload } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
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

const imageUrl = computed(() => {
  if (form.value.image_preview) return form.value.image_preview
  const img = form.value.image
  if (!img) return null
  const base = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  return img.startsWith('http') ? img : `${base}/storage/${img}`
})

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function variantImageUrl(v: VariantForm): string | null {
  if (v.image_preview) return v.image_preview
  if (!v.image) return null
  return v.image.startsWith('http') ? v.image : `${baseUrl}/storage/${v.image}`
}

onMounted(async () => {
  try {
    const { data: catRes } = await api.get('/categories')
    categories.value = catRes.data
  } catch {}

  try {
    const [supRes] = await Promise.all([
      api.get('/suppliers'),
    ])
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

function defaultVariant(): VariantForm {
  return {
    sku: '', size: '', color: '', price_adjustment: 0, purchase_price: null, stock_quantity: 0,
    image: null, image_file: null, image_preview: null,
  }
}

function addVariant() {
  form.value.variants.push(defaultVariant())
}

function removeVariant(idx: number) {
  form.value.variants.splice(idx, 1)
}

function variantError(field: string, idx: number): string | null {
  const key = `variants.${idx}.${field}`
  return fieldErrors.value?.[key] ? firstError(fieldErrors.value, key) : null
}

function variantFieldClass(field: string, idx: number) {
  return variantError(field, idx) ? 'border-red-400 dark:border-red-500 focus-visible:ring-red-400' : ''
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

    // Upload product image
    if (form.value.image_file) {
      const fd = new FormData()
      fd.append('image', form.value.image_file)
      await api.post(`/products/${productId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }

    // Upload variant images using variant IDs from the saved product
    const savedVariants = isEdit
      ? (await api.get(`/products/${productId}`)).data.data.variants
      : (await api.get(`/products/${productId}`)).data.data.variants
    for (let i = 0; i < form.value.variants.length; i++) {
      const v = form.value.variants[i]
      if (v.image_file && savedVariants[i]) {
        const fd = new FormData()
        fd.append('image', v.image_file)
        await api.post(`/variants/${savedVariants[i].id}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
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
  <div class="mx-auto max-w-2xl space-y-5">
    <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ isEdit ? t('products.edit_product') : t('products.new_product') }}</h1>

    <div v-if="fieldErrors && Object.keys(fieldErrors).length" class="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
      <AlertCircle class="size-5 text-red-500 shrink-0 mt-0.5" />
      <div class="text-sm text-red-700 dark:text-red-300 space-y-0.5">
        <p v-for="fe in formatFieldErrors(fieldErrors)" :key="fe.label">
          <span class="font-medium">{{ fe.label }}:</span>
          <span v-for="(msg, i) in fe.messages" :key="`${fe.label}-${i}`">{{ i > 0 ? ', ' : ' ' }}{{ msg }}</span>
        </p>
      </div>
    </div>

    <Card>
      <CardHeader><CardTitle>{{ t('common.details') }}</CardTitle></CardHeader>
      <CardContent class="space-y-5">
        <div class="space-y-1.5">
          <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('products.product_name') }}</label>
          <Input v-model="form.name"
            :class="firstError(fieldErrors, 'name') ? 'border-red-400 dark:border-red-500 focus-visible:ring-red-400' : ''" />
          <p v-if="firstError(fieldErrors, 'name')" class="text-xs text-red-500 dark:text-red-400">{{ firstError(fieldErrors, 'name') }}</p>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('products.category') }}</label>
          <select v-model="form.category_id"
            class="w-full h-9 rounded-md border bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 transition-colors"
            :class="firstError(fieldErrors, 'category_id') ? 'border-red-400 dark:border-red-500' : 'border-zinc-200 dark:border-zinc-700'">
            <option value="" disabled>{{ t('common.select') }}</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
          <p v-if="firstError(fieldErrors, 'category_id')" class="text-xs text-red-500 dark:text-red-400">{{ firstError(fieldErrors, 'category_id') }}</p>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('nav.suppliers') }}</label>
          <select v-model="form.supplier_id"
            class="w-full h-9 rounded-md border bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 transition-colors border-zinc-200 dark:border-zinc-700">
            <option :value="null">{{ t('common.select') }}</option>
            <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('products.base_price') }} (Ks)</label>
          <Input v-model.number="form.base_price" type="number" min="0"
            :class="firstError(fieldErrors, 'base_price') ? 'border-red-400 dark:border-red-500 focus-visible:ring-red-400' : ''" />
          <p v-if="firstError(fieldErrors, 'base_price')" class="text-xs text-red-500 dark:text-red-400">{{ firstError(fieldErrors, 'base_price') }}</p>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('products.image') }}</label>
          <div class="flex items-start gap-4">
            <div v-if="imageUrl" class="relative shrink-0">
              <img :src="imageUrl" class="size-24 rounded-lg border border-zinc-200 dark:border-zinc-700 object-cover" />
              <button @click="form.image_preview = null; form.image_file = null; form.image = null" class="absolute -top-2 -right-2 rounded-full bg-red-500 text-white p-0.5 shadow">
                <X class="size-3" />
              </button>
            </div>
            <label class="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Upload class="size-4" />
              {{ imageUrl ? t('common.edit') : t('common.create') }}
              <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onProductImage" />
            </label>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('common.description') }}</label>
          <textarea v-model="form.description"
            class="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 min-h-[80px] transition-colors" rows="3" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle>{{ t('products.variants') }}</CardTitle>
        <Button variant="outline" size="sm" @click="addVariant"><Plus class="size-4" /> {{ t('products.add_variant') }}</Button>
      </CardHeader>
      <CardContent class="space-y-4">
        <p v-if="form.variants.length === 0" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('products.no_variants') }}</p>

        <div v-for="(v, idx) in form.variants" :key="idx"
          class="relative rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">{{ t('products.variant') }} #{{ idx + 1 }}</span>
            <button @click="removeVariant(idx)" class="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 transition-colors" :title="t('common.delete')">
              <X class="size-4" />
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="space-y-1 sm:col-span-2 lg:col-span-1">
              <label class="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{{ t('products.sku') }} / Barcode <span class="text-red-400">*</span></label>
              <Input v-model="v.sku" :class="variantFieldClass('sku', idx)" />
              <p v-if="variantError('sku', idx)" class="text-xs text-red-500 dark:text-red-400 leading-tight">{{ variantError('sku', idx) }}</p>
            </div>
            <div class="space-y-1">
              <label class="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{{ t('products.size') }}</label>
              <Input v-model="v.size" :class="variantFieldClass('size', idx)" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{{ t('products.color') }}</label>
              <Input v-model="v.color" :class="variantFieldClass('color', idx)" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{{ t('products.price_adj') }}</label>
              <Input v-model.number="v.price_adjustment" type="number" :class="variantFieldClass('price_adjustment', idx)" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Cost</label>
              <Input :model-value="v.purchase_price ?? ''" @update:model-value="v.purchase_price = $event === '' ? null : Number($event)" type="number" min="0" :class="variantFieldClass('purchase_price', idx)" />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-zinc-400 dark:text-zinc-500 font-medium">{{ t('products.stock') }}</label>
              <Input v-model.number="v.stock_quantity" type="number" min="0" :class="variantFieldClass('stock_quantity', idx)" />
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div v-if="variantImageUrl(v)" class="relative shrink-0">
              <img :src="variantImageUrl(v)!" class="size-14 rounded-md border border-zinc-200 dark:border-zinc-700 object-cover" />
            </div>
            <label class="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Upload class="size-3.5" />
              {{ v.image_preview ? t('common.edit') : t('products.image') }}
              <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onVariantImage($event, idx)" />
            </label>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="flex flex-col sm:flex-row justify-end gap-2">
      <Button variant="outline" @click="router.back()" class="w-full sm:w-auto">{{ t('common.cancel') }}</Button>
      <Button :disabled="saving" @click="save" class="w-full sm:w-auto">{{ saving ? t('common.loading') : t('common.save') }}</Button>
    </div>
  </div>
</template>

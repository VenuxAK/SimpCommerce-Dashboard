<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ShoppingCart, X, Plus, Minus, User, Barcode } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import { Badge } from '../components/ui/badge'
import { useNotify } from '../lib/notify'
import type { Product, ProductVariant, Customer } from '../types'

const { t } = useI18n()
const { success, error } = useNotify()

const products = ref<Product[]>([])
const categories = ref<{ id: number; name: string }[]>([])
const selectedCategory = ref<number | ''>('')
const search = ref('')
const searchInput = ref<any>(null)
let searchTimer: ReturnType<typeof setTimeout>
const cart = ref<Array<{ variant: ProductVariant; product: Product; quantity: number }>>([])
const showVariantDialog = ref(false)
const selectedProduct = ref<Product | null>(null)
const customerSearch = ref('')
const customers = ref<Customer[]>([])
const showCustomerSearch = ref(false)
const selectedCustomer = ref<Customer | null>(null)
const paymentMethod = ref('cash')
const amountReceived = ref<number | string>('')
const loading = ref(false)
const completed = ref(false)
const dataLoading = ref(true)
const showCart = ref(false)

// Discount state
const discounts = ref<any[]>([])
const selectedDiscount = ref<any | null>(null)

// Barcode scan state
let barcodeBuffer = ''
let barcodeTimer: ReturnType<typeof setTimeout> | null = null
const barcodeActive = ref(false)

const subtotal = computed(() =>
  cart.value.reduce((sum, item) => sum + (item.product.base_price + item.variant.price_adjustment) * item.quantity, 0),
)

const discountAmount = computed(() => {
  if (!selectedDiscount.value) return 0
  const d = selectedDiscount.value
  let eligibleTotal = 0
  if (d.applies_to === 'all') {
    eligibleTotal = subtotal.value
  } else if (d.applies_to === 'category') {
    for (const item of cart.value) {
      if (item.product.category_id === d.category_id) {
        eligibleTotal += (item.product.base_price + item.variant.price_adjustment) * item.quantity
      }
    }
  } else if (d.applies_to === 'product') {
    for (const item of cart.value) {
      if (item.product.id === d.product_id) {
        eligibleTotal += (item.product.base_price + item.variant.price_adjustment) * item.quantity
      }
    }
  }
  if (d.type === 'percentage') return Math.round(eligibleTotal * d.value / 100 * 100) / 100
  return Math.min(d.value, eligibleTotal)
})

const totalAfterDiscount = computed(() => Math.max(0, subtotal.value - discountAmount.value))

const discountLabel = computed(() => {
  if (!selectedDiscount.value) return ''
  const d = selectedDiscount.value
  return d.type === 'percentage' ? `${d.value}%` : `-${d.value.toLocaleString()} Ks`
})

const parsedAmount = computed(() => {
  const val = typeof amountReceived.value === 'string' ? parseFloat(amountReceived.value) : amountReceived.value
  return isNaN(val) ? 0 : val
})

const change = computed(() => Math.max(0, parsedAmount.value - totalAfterDiscount.value))

function imgUrl(product: Product): string | null {
  return product.image_url || null
}

onMounted(async () => {
  try {
    const [prodRes, catRes] = await Promise.all([
      api.get('/products'),
      api.get('/categories'),
    ])
    products.value = prodRes.data.data
    categories.value = catRes.data.data
    const discRes = await api.get('/discounts/active')
    discounts.value = discRes.data.data
  } catch (e: any) {
    error(e?.response?.data?.message || t('dashboard.load_failed'))
  } finally {
    dataLoading.value = false
  }

  window.addEventListener('keydown', handleBarcodeKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleBarcodeKey)
})

function handleBarcodeKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && barcodeBuffer.length >= 3) {
    e.preventDefault()
    barcodeActive.value = true
    lookupBarcode(barcodeBuffer)
    barcodeBuffer = ''
    return
  }

  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    searchInput.value?.focus()
    return
  }
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '')) {
    e.preventDefault()
    searchInput.value?.focus()
    return
  }

  if (e.key.length === 1) {
    if (barcodeTimer) clearTimeout(barcodeTimer)
    barcodeBuffer += e.key
    barcodeTimer = setTimeout(() => { barcodeBuffer = ''; barcodeActive.value = false }, 100)
  }
}

async function lookupBarcode(sku: string) {
  try {
    const { data } = await api.get(`/variants/by-sku/${encodeURIComponent(sku)}`)
    const variant = data.variant as ProductVariant
    const product = data.product as Product

    const existingProduct = products.value.find((p) => p.id === product.id)
    if (!existingProduct) {
      products.value.push(product)
    }

    const existing = cart.value.find((item) => item.variant.id === variant.id)
    if (existing) {
      existing.quantity++
    } else {
      cart.value.push({ variant, product, quantity: 1 })
    }
    success(`${product.name} (${variant.size}/${variant.color}) ${t('pos.item_added')}`)
  } catch {
    error(`SKU not found: ${sku}`)
  } finally {
    barcodeActive.value = false
  }
}

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase().trim()
  return products.value.filter((p) => {
    if (selectedCategory.value && p.category_id !== selectedCategory.value) return false
    if (!q) return true
    if (p.name.toLowerCase().includes(q)) return true
    if (p.category?.name?.toLowerCase().includes(q)) return true
    if (p.variants?.some((v: any) => v.sku?.toLowerCase().includes(q))) return true
    return false
  })
})

function openVariantDialog(product: Product) {
  selectedProduct.value = product
  showVariantDialog.value = true
}

function addToCart(variant: ProductVariant) {
  const product = selectedProduct.value!
  const existing = cart.value.find((item) => item.variant.id === variant.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({ variant, product, quantity: 1 })
  }
  showVariantDialog.value = false
  success(t('pos.item_added'))
}

function removeFromCart(index: number) {
  cart.value.splice(index, 1)
}

function updateQuantity(index: number, delta: number) {
  const item = cart.value[index]
  const newQty = item.quantity + delta
  if (newQty <= 0) {
    cart.value.splice(index, 1)
  } else if (delta > 0 && newQty > item.variant.stock_quantity) {
    error(`${t('validation.insufficient_stock')} (${item.variant.stock_quantity})`)
  } else {
    item.quantity = newQty
  }
}

function debouncedSearch(query: string) {
  customerSearch.value = query
  clearTimeout(searchTimer)
  if (query.length < 1) return
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/customers', { params: { search: query } })
      customers.value = data.data
    } catch {}
  }, 300)
}

async function completeSale() {
  if (cart.value.length === 0) return

  const requiredAmount = totalAfterDiscount.value
  if (parsedAmount.value < requiredAmount) {
    error(t('pos.amount_received') + ' ' + t('common.error_short'))
    return
  }

  loading.value = true
  try {
    await api.post('/orders', {
      customer_id: selectedCustomer.value?.id || null,
      discount_id: selectedDiscount.value?.id || null,
      notes: null,
      items: cart.value.map((item) => ({
        product_variant_id: item.variant.id,
        quantity: item.quantity,
      })),
      payment: {
        method: paymentMethod.value,
        amount: totalAfterDiscount.value,
      },
    })
    success(t('pos.sale_completed'))
    cart.value = []
    selectedCustomer.value = null
    amountReceived.value = ''
  } catch (e: any) {
    const msg = e?.response?.data?.message || t('common.error')
    error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="dataLoading" class="text-sm text-zinc-400 dark:text-zinc-500">{{ t('common.loading') }}</div>

  <div v-else class="flex flex-col lg:flex-row gap-4 lg:gap-6">
    <div class="flex-1 space-y-4 min-w-0">
      <div class="flex items-center justify-between">
        <h1 class="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{ t('pos.title') }}</h1>
        <button @click="showCart = !showCart" class="lg:hidden relative p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
          <ShoppingCart class="size-5" />
          <span v-if="cart.length" class="absolute -top-1 -right-1 size-5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs flex items-center justify-center">{{ cart.length }}</span>
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 dark:text-zinc-500" />
          <Input ref="searchInput" v-model="search" :placeholder="t('pos.search_product') + ' (Ctrl+K)'" class="pl-9" />
          <Barcode v-if="barcodeActive" class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-green-500 animate-pulse" />
        </div>
        <select v-model="selectedCategory"
          class="h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100 w-full sm:w-auto"
        >
          <option value="">{{ t('pos.all_categories') }}</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div v-if="barcodeActive" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
        <Barcode class="size-3" /> Scanning barcode...
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card v-for="product in filteredProducts" :key="product.id"
          class="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
          @click="openVariantDialog(product)"
        >
          <CardContent class="p-3 sm:p-4 text-center">
            <div class="mb-2 flex h-16 sm:h-20 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 overflow-hidden">
              <img v-if="imgUrl(product)" :src="imgUrl(product)!" :alt="product.name" class="size-full object-cover" />
              <span v-else class="text-2xl sm:text-3xl">👕</span>
            </div>
            <p class="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ product.name }}</p>
            <p class="text-sm font-bold text-zinc-900 dark:text-zinc-100">{{ product.base_price.toLocaleString() }} Ks</p>
          </CardContent>
        </Card>
      </div>
    </div>

    <div class="w-full lg:w-96 shrink-0" :class="{ 'hidden lg:block': !showCart }">
      <Card>
        <CardContent class="p-4 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-zinc-900 dark:text-zinc-100">{{ t('pos.cart') }} ({{ cart.length }})</h2>
            <div class="flex items-center gap-2">
              <button @click="showCustomerSearch = !showCustomerSearch" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 truncate max-w-40">
                <User class="size-4 inline" /> {{ selectedCustomer?.name || t('pos.select_customer') }}
              </button>
              <button @click="showCart = false" class="lg:hidden text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
                <X class="size-4" />
              </button>
            </div>
          </div>

          <div v-if="showCustomerSearch" class="space-y-2">
            <Input v-model="customerSearch" :placeholder="t('common.search')" @input="debouncedSearch(customerSearch)" />
            <div v-for="c in customers" :key="c.id"
              class="cursor-pointer rounded px-2 py-1 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 truncate"
              @click="selectedCustomer = c; showCustomerSearch = false; customerSearch = ''"
            >
              {{ c.name }} — {{ c.phone || '—' }}
            </div>
          </div>

          <div v-if="cart.length === 0" class="py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
            {{ t('pos.empty_cart') }}
          </div>

          <div v-for="(item, idx) in cart" :key="item.variant.id"
            class="flex items-center gap-2 rounded-lg border border-zinc-100 dark:border-zinc-800 p-2"
          >
            <div v-if="item.variant.image_url" class="size-9 rounded-md overflow-hidden shrink-0 bg-zinc-50 dark:bg-zinc-800">
              <img :src="item.variant.image_url" class="size-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{{ item.product.name }}</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500">{{ item.variant.size }} / {{ item.variant.color }} <Badge variant="secondary" class="ml-1">{{ item.variant.stock_quantity }}</Badge></p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button @click="updateQuantity(idx, -1)" class="size-6 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800"><Minus class="size-3" /></button>
              <span class="w-6 text-center text-sm text-zinc-900 dark:text-zinc-100">{{ item.quantity }}</span>
              <button @click="updateQuantity(idx, 1)" class="size-6 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800"><Plus class="size-3" /></button>
            </div>
            <p class="w-16 sm:w-20 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100 shrink-0">
              {{ ((item.product.base_price + item.variant.price_adjustment) * item.quantity).toLocaleString() }}
            </p>
            <button @click="removeFromCart(idx)" class="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 shrink-0">
              <X class="size-4" />
            </button>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('validation.apply_discount') }}</label>
            <select v-model="selectedDiscount" @change="() => {}"
              class="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
              <option :value="null">{{ t('validation.no_discount') }}</option>
              <option v-for="d in discounts" :key="d.id" :value="d">
                {{ d.name }} ({{ d.type === 'percentage' ? d.value + '%' : d.value.toLocaleString() + ' Ks' }}) — {{ d.applies_to }}
              </option>
            </select>
          </div>

          <div class="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2 font-bold text-zinc-900 dark:text-zinc-100">
            <span>{{ t('pos.subtotal') }}</span>
            <span>{{ subtotal.toLocaleString() }} Ks</span>
          </div>

          <div v-if="discountAmount > 0" class="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>{{ t('validation.discount') }} {{ discountLabel }}</span>
            <span>-{{ discountAmount.toLocaleString() }} Ks</span>
          </div>

          <div v-if="discountAmount > 0" class="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
            <span>{{ t('common.total') }}</span>
            <span>{{ totalAfterDiscount.toLocaleString() }} Ks</span>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('pos.amount_received') }}</label>
            <Input v-model="amountReceived" type="number" min="0" step="0.01" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">{{ t('pos.payment_method') }}</label>
            <select v-model="paymentMethod" class="w-full h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-100">
              <option value="cash">{{ t('pos.cash') }}</option>
              <option value="transfer">{{ t('pos.transfer') }}</option>
            </select>
          </div>

          <div v-if="parsedAmount > 0" class="flex justify-between text-sm">
            <span class="text-zinc-600 dark:text-zinc-400">{{ t('pos.change') }}</span>
            <span class="font-semibold text-green-600 dark:text-green-400">{{ change.toLocaleString() }} Ks</span>
          </div>

          <Button class="w-full" :disabled="cart.length === 0 || loading" @click="completeSale">
            {{ loading ? t('common.loading') : t('pos.complete_sale') }}
          </Button>

          <p v-if="completed" class="text-center text-sm text-green-600 dark:text-green-400">{{ t('pos.sale_completed') }}</p>
        </CardContent>
      </Card>
    </div>

    <div v-if="showVariantDialog && selectedProduct" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="showVariantDialog = false">
      <Card class="w-full max-w-sm">
        <CardContent class="p-4 sm:p-6 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-zinc-900 dark:text-zinc-100">{{ t('pos.choose_variant') }}</h3>
            <button @click="showVariantDialog = false" class="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"><X class="size-4" /></button>
          </div>
          <div class="flex items-center gap-3">
            <div v-if="imgUrl(selectedProduct)" class="size-12 rounded-lg overflow-hidden shrink-0">
              <img :src="imgUrl(selectedProduct)!" class="size-full object-cover" />
            </div>
            <p class="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">{{ selectedProduct.name }}</p>
          </div>
          <button v-for="v in selectedProduct.variants" :key="v.id"
            @click="addToCart(v)"
            class="flex w-full items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            :disabled="v.stock_quantity === 0"
          >
            <div v-if="v.image_url" class="size-10 rounded-md overflow-hidden shrink-0 bg-zinc-50 dark:bg-zinc-800">
              <img :src="v.image_url" class="size-full object-cover" />
            </div>
            <span class="flex-1 truncate text-left">{{ v.size }} / {{ v.color }}</span>
            <span class="font-semibold">{{ (selectedProduct.base_price + v.price_adjustment).toLocaleString() }} Ks</span>
            <Badge v-if="v.stock_quantity === 0" variant="destructive">{{ t('dashboard.out_of_stock') }}</Badge>
            <Badge v-else variant="secondary">{{ v.stock_quantity }}</Badge>
          </button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

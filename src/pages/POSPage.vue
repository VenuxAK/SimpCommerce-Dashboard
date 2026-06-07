<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ShoppingCart, X, Plus, Minus, User, Barcode, Maximize2, Percent, Check, CreditCard, Wallet } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
import Select from '../components/ui/Select.vue'
import { Badge } from '../components/ui/badge'
import { useNotify } from '../lib/notify'
import type { Discount, Product, ProductVariant, Customer } from '../types'

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
const dataLoading = ref(true)
const showCart = ref(false)
const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// Discount state
const discounts = ref<Discount[]>([])
const selectedDiscount = ref<Discount | null>(null)

const categoryOptions = computed(() => [
  { label: t('pos.all_categories'), value: '' },
  ...categories.value.map(c => ({ label: c.name, value: c.id }))
])

const discountOptions = computed(() => [
  { label: 'NO DISCOUNT', value: '' },
  ...discounts.value.map(d => ({ 
    label: `${d.name} (${d.type === 'percentage' ? d.value + '%' : d.value.toLocaleString() + ' Ks'})`, 
    value: String(d.id) 
  }))
])

const selectedDiscountId = ref('')
watch(selectedDiscountId, (id) => {
  selectedDiscount.value = discounts.value.find(d => String(d.id) === id) || null
})

const paymentOptions = [
  { label: 'CASH', value: 'cash' },
  { label: 'TRANSFER', value: 'transfer' }
]

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
      api.get('/products', { params: { per_page: 500 } }),
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
    if (barcodeBuffer.length === 0) {
      barcodeTimer = setTimeout(() => { barcodeBuffer = ''; barcodeActive.value = false }, 100)
    }
    barcodeBuffer += e.key
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
    success(`${product.name} (${variant.size}/${variant.color}) added`)
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
    error(t('pos.amount_received') + ' is insufficient')
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
    selectedDiscountId.value = ''
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
  <div v-if="dataLoading" class="flex h-96 items-center justify-center text-muted-foreground">
    <div class="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>

  <div v-else :class="['flex flex-col lg:flex-row gap-8 transition-all animate-in fade-in duration-500', isFullscreen ? 'fixed inset-0 z-50 bg-background p-8 overflow-auto' : '']">
    <div class="flex-1 space-y-6 min-w-0">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">{{ t('pos.title') }}</h1>
          <button 
            @click="toggleFullscreen"
            class="hidden lg:flex size-8 items-center justify-center rounded-md border bg-background hover:bg-accent text-muted-foreground transition-all"
            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
          >
            <component :is="isFullscreen ? X : Maximize2" class="size-3.5" />
          </button>
        </div>
        <button @click="showCart = !showCart" class="lg:hidden relative p-2 rounded-md border bg-background text-muted-foreground">
          <ShoppingCart class="size-5" />
          <span v-if="cart.length" class="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center ring-2 ring-background">{{ cart.length }}</span>
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input ref="searchInput" v-model="search" :placeholder="t('pos.search_product') + ' (Ctrl+K)'" class="pl-10 h-10 shadow-none border-border/60" />
          <Barcode v-if="barcodeActive" class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-pulse" />
        </div>
        <Select v-model="selectedCategory" :options="categoryOptions" class="sm:w-56 h-10 border-border/60" />
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <div v-for="product in filteredProducts" :key="product.id"
          class="group cursor-pointer rounded-lg border border-border/50 bg-card p-1.5 hover:border-primary/50 transition-all duration-300"
          @click="openVariantDialog(product)"
        >
          <div class="relative aspect-[4/5] mb-2 overflow-hidden rounded-md bg-muted/30">
            <img v-if="imgUrl(product)" :src="imgUrl(product)!" :alt="product.name" class="size-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
            <div v-else class="flex size-full items-center justify-center text-3xl opacity-10">👕</div>
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>
          <div class="px-1.5 pb-1.5 text-center">
            <p class="text-[11px] font-medium text-muted-foreground truncate">{{ product.category?.name?.toUpperCase() }}</p>
            <p class="text-sm font-semibold text-foreground truncate mt-0.5">{{ product.name }}</p>
            <p class="text-xs font-bold text-primary mt-1">{{ product.base_price.toLocaleString() }} Ks</p>
          </div>
        </div>
      </div>
    </div>

    <aside :class="['w-full lg:w-[400px] shrink-0 transition-all duration-300 lg:sticky lg:top-4 lg:self-start', isFullscreen ? 'lg:pt-0' : '', showCart ? 'block' : 'hidden lg:block']">
      <Card class="border shadow-none rounded-xl overflow-hidden flex flex-col h-full lg:max-h-[calc(100vh-8rem)]">
        <div class="p-5 border-b bg-muted/10">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
              <ShoppingCart class="size-4" />
              {{ t('pos.cart') }}
              <Badge variant="secondary" class="h-5 px-1.5 text-[10px] font-medium">{{ cart.length }} items</Badge>
            </h2>
            <button @click="showCart = false" class="lg:hidden p-1.5 rounded-md hover:bg-accent transition-colors">
              <X class="size-4" />
            </button>
          </div>

          <div class="relative">
            <button 
              @click="showCustomerSearch = !showCustomerSearch" 
              class="flex items-center gap-3 w-full p-2.5 rounded-md border bg-background hover:bg-accent/50 transition-all text-left group"
            >
              <div class="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-background border border-transparent group-hover:border-border transition-all">
                <User class="size-4" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none">{{ t('pos.customer') }}</p>
                <p class="text-xs font-semibold text-foreground truncate mt-1">{{ selectedCustomer?.name || t('pos.select_customer') }}</p>
              </div>
            </button>

            <div v-if="showCustomerSearch" class="absolute top-full left-0 right-0 mt-1 z-20 space-y-1 animate-in fade-in slide-in-from-top-1">
              <div class="p-2 bg-popover border rounded-lg shadow-lg">
                <Input v-model="customerSearch" :placeholder="t('common.search')" @input="debouncedSearch(customerSearch)" class="h-8 text-xs mb-2" auto-focus />
                <div class="max-h-48 overflow-auto custom-scrollbar">
                  <div v-for="c in customers" :key="c.id"
                    class="cursor-pointer px-3 py-2 rounded-md hover:bg-accent transition-colors mb-1 last:mb-0"
                    @click="selectedCustomer = c; showCustomerSearch = false; customerSearch = ''"
                  >
                    <p class="text-xs font-semibold">{{ c.name }}</p>
                    <p class="text-[10px] text-muted-foreground">{{ c.phone || 'No phone' }}</p>
                  </div>
                  <p v-if="!customers.length && customerSearch" class="text-[10px] text-center py-4 text-muted-foreground italic">No customers found</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[200px]">
          <div v-if="cart.length === 0" class="h-full flex flex-col items-center justify-center opacity-40 py-20">
            <ShoppingCart class="size-10 mb-4 stroke-[1px]" />
            <p class="text-xs font-medium uppercase tracking-widest">{{ t('pos.empty_cart') }}</p>
          </div>

          <div v-for="(item, idx) in cart" :key="item.variant.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors group mb-1"
          >
            <div class="relative size-12 rounded-md overflow-hidden bg-muted/50 shrink-0 border">
              <img v-if="item.variant.image_url" :src="item.variant.image_url" class="size-full object-cover" />
              <span v-else class="flex size-full items-center justify-center text-sm opacity-20">👕</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-foreground truncate">{{ item.product.name }}</p>
              <p class="text-[10px] text-muted-foreground mt-0.5">{{ item.variant.size }} / {{ item.variant.color }}</p>
              <div class="flex items-center gap-2.5 mt-2">
                <button @click="updateQuantity(idx, -1)" class="size-5 rounded border bg-background hover:bg-accent flex items-center justify-center transition-colors"><Minus class="size-3" /></button>
                <span class="text-xs font-semibold w-4 text-center tabular-nums">{{ item.quantity }}</span>
                <button @click="updateQuantity(idx, 1)" class="size-5 rounded border bg-background hover:bg-accent flex items-center justify-center transition-colors"><Plus class="size-3" /></button>
              </div>
            </div>
            <div class="text-right self-start pt-1">
              <p class="text-xs font-bold text-foreground tabular-nums">
                {{ ((item.product.base_price + item.variant.price_adjustment) * item.quantity).toLocaleString() }}
              </p>
              <button @click="removeFromCart(idx)" class="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1 mt-2">
                <X class="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div class="p-5 border-t bg-muted/5 space-y-4">
          <div class="space-y-3">
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span class="tabular-nums">{{ subtotal.toLocaleString() }} Ks</span>
            </div>
            
            <div class="flex items-center justify-between gap-4">
              <div class="relative flex-1">
                <Select v-model="selectedDiscountId" :options="discountOptions" class="h-8 text-[10px] shadow-none border-border/40" />
              </div>
              <div v-if="discountAmount > 0" class="text-xs text-primary font-semibold tabular-nums text-right">
                -{{ discountAmount.toLocaleString() }} Ks
              </div>
            </div>

            <div class="h-px bg-border/40 my-2" />
            
            <div class="flex justify-between items-center">
              <span class="text-sm font-semibold">Total</span>
              <span class="text-xl font-bold tracking-tight tabular-nums">{{ totalAfterDiscount.toLocaleString() }} Ks</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Method</label>
              <Select v-model="paymentMethod" :options="paymentOptions" class="h-9 text-xs" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-0.5">Amount</label>
              <Input v-model="amountReceived" type="number" min="0" step="0.01" class="h-9 text-right font-bold tabular-nums text-xs" placeholder="0.00" />
            </div>
          </div>

          <div v-if="parsedAmount > 0" class="flex justify-between items-center px-4 py-2 rounded-md bg-secondary/50 border">
            <span class="text-[10px] font-medium text-muted-foreground uppercase">Change</span>
            <span class="text-sm font-bold tabular-nums">{{ change.toLocaleString() }} Ks</span>
          </div>

          <Button class="w-full h-10 text-xs font-semibold shadow-sm" :disabled="cart.length === 0 || loading" @click="completeSale">
            <Check v-if="!loading" class="size-3.5 mr-2" />
            {{ loading ? 'Processing...' : 'Complete Sale' }}
          </Button>
        </div>
      </Card>
    </aside>

    <div v-if="showVariantDialog && selectedProduct" class="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      @click.self="showVariantDialog = false">
      <Card class="w-full max-w-sm rounded-xl overflow-hidden border shadow-2xl animate-in zoom-in-95 duration-200">
        <div class="p-5 border-b flex items-center justify-between bg-muted/10">
          <div class="flex items-center gap-3">
            <div v-if="imgUrl(selectedProduct)" class="size-10 rounded border bg-background shrink-0 overflow-hidden">
              <img :src="imgUrl(selectedProduct)!" class="size-full object-cover" />
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-sm truncate">{{ selectedProduct.name }}</h3>
              <p class="text-[10px] text-muted-foreground uppercase tracking-wider">{{ t('pos.choose_variant') }}</p>
            </div>
          </div>
          <button @click="showVariantDialog = false" class="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"><X class="size-4" /></button>
        </div>
        <div class="p-4 space-y-1.5 max-h-[50vh] overflow-auto custom-scrollbar">
          <button v-for="v in selectedProduct.variants" :key="v.id"
            @click="addToCart(v)"
            class="group flex w-full items-center gap-4 rounded-lg border border-border/40 p-3 text-left transition-all hover:bg-accent hover:border-border disabled:opacity-30 disabled:grayscale"
            :disabled="v.stock_quantity === 0"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold">{{ v.size }}</span>
                <span class="text-muted-foreground/30 text-[10px]">•</span>
                <span class="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">{{ v.color }}</span>
              </div>
              <p class="text-[10px] mt-1" :class="v.stock_quantity < 5 ? 'text-orange-500 font-semibold' : 'text-muted-foreground'">
                {{ v.stock_quantity }} units in stock
              </p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-foreground">
                {{ (selectedProduct.base_price + v.price_adjustment).toLocaleString() }} Ks
              </p>
              <Badge v-if="v.stock_quantity === 0" variant="secondary" class="mt-1 h-4 px-1.5 text-[9px] font-medium uppercase">Sold Out</Badge>
            </div>
          </button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ShoppingCart, X, Plus, Minus, User, Barcode, Maximize2, Percent } from 'lucide-vue-next'
import api from '../lib/axios'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import Input from '../components/ui/Input.vue'
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
const completed = ref(false)
const dataLoading = ref(true)
const showCart = ref(false)
const isFullscreen = ref(false)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// Discount state
const discounts = ref<Discount[]>([])

const selectedDiscount = ref<Discount | null>(null)
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
  <div v-if="dataLoading" class="flex h-96 items-center justify-center text-muted-foreground">
    <div class="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>

  <div v-else :class="['flex flex-col lg:flex-row gap-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500', isFullscreen ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : '']">
    <div class="flex-1 space-y-6 min-w-0">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <h1 class="text-3xl font-black tracking-tighter text-foreground uppercase italic">{{ t('pos.title') }}</h1>
          <button 
            @click="toggleFullscreen"
            class="hidden lg:flex size-9 items-center justify-center rounded-md border border-border bg-card hover:bg-secondary text-muted-foreground transition-all"
            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
          >
            <component :is="isFullscreen ? X : Maximize2" class="size-4" />
          </button>
        </div>
        <button @click="showCart = !showCart" class="lg:hidden relative p-2 rounded-md border border-border bg-card text-muted-foreground">
          <ShoppingCart class="size-5" />
          <span v-if="cart.length" class="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center ring-2 ring-background">{{ cart.length }}</span>
        </button>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input ref="searchInput" v-model="search" :placeholder="t('pos.search_product') + ' (Ctrl+K)'" class="pl-10 h-10 rounded-md border-zinc-200/60 dark:border-zinc-800/60 shadow-none focus-visible:ring-primary/20" />
          <Barcode v-if="barcodeActive" class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-primary animate-pulse" />
        </div>
        <select v-model="selectedCategory"
          class="h-10 rounded-md border border-input bg-card px-4 text-xs font-black uppercase tracking-widest text-foreground w-full sm:w-48 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        >
          <option value="">{{ t('pos.all_categories') }}</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        <div v-for="product in filteredProducts" :key="product.id"
          class="group cursor-pointer rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-card p-1.5 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/50 transition-all duration-300"
          @click="openVariantDialog(product)"
        >
          <div class="relative aspect-square mb-2 overflow-hidden rounded-lg bg-secondary/30">
            <img v-if="imgUrl(product)" :src="imgUrl(product)!" :alt="product.name" class="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div v-else class="flex size-full items-center justify-center text-3xl grayscale opacity-20">👕</div>
            <div class="absolute top-2 right-2 size-6 rounded-full bg-background/80 backdrop-blur shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus class="size-3 text-foreground" />
            </div>
          </div>
          <div class="px-1.5 pb-1.5">
            <p class="text-xs font-black text-foreground uppercase tracking-tight truncate">{{ product.name }}</p>
            <p class="text-sm font-black text-primary mt-0.5 tracking-tighter">{{ product.base_price.toLocaleString() }} Ks</p>
          </div>
        </div>
      </div>
    </div>

    <div :class="['w-full lg:w-[380px] shrink-0 lg:sticky lg:top-20 h-fit transition-all duration-300', isFullscreen ? 'lg:top-6' : '', showCart ? 'block' : 'hidden lg:block']">
      <Card class="border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl shadow-primary/5 rounded-2xl overflow-hidden bg-card">
        <div class="bg-muted/30 p-5 border-b">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart class="size-4" />
              {{ t('pos.cart') }}
              <span class="text-[10px] font-bold text-muted-foreground ml-1">({{ cart.length }})</span>
            </h2>
            <button @click="showCart = false" class="lg:hidden p-1.5 rounded-md hover:bg-secondary transition-colors">
              <X class="size-4" />
            </button>
          </div>

          <button 
            @click="showCustomerSearch = !showCustomerSearch" 
            class="flex items-center gap-3 w-full p-2.5 rounded-lg bg-background border border-zinc-200/60 dark:border-zinc-800/60 hover:border-primary/50 transition-all text-left group"
          >
            <div class="size-8 rounded bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <User class="size-4" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{{ t('pos.customer') }}</p>
              <p class="text-xs font-bold text-foreground truncate">{{ selectedCustomer?.name || t('pos.select_customer') }}</p>
            </div>
          </button>

          <div v-if="showCustomerSearch" class="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1">
            <Input v-model="customerSearch" :placeholder="t('common.search')" @input="debouncedSearch(customerSearch)" class="h-9 rounded-md text-xs font-bold" />
            <div class="max-h-40 overflow-auto rounded-lg border border-zinc-200/60 dark:border-zinc-800/60 bg-background shadow-xl">
              <div v-for="c in customers" :key="c.id"
                class="cursor-pointer px-3 py-2 text-[11px] text-foreground hover:bg-secondary transition-colors border-b last:border-0"
                @click="selectedCustomer = c; showCustomerSearch = false; customerSearch = ''"
              >
                <div class="font-black uppercase">{{ c.name }}</div>
                <div class="text-[9px] text-muted-foreground font-bold tracking-wider">{{ c.phone || 'NO PHONE' }}</div>
              </div>
            </div>
          </div>
        </div>

        <CardContent class="p-5 space-y-5">
          <div class="space-y-3 max-h-[35vh] overflow-auto pr-1 custom-scrollbar">
            <div v-if="cart.length === 0" class="py-10 text-center">
              <p class="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{{ t('pos.empty_cart') }}</p>
            </div>

            <div v-for="(item, idx) in cart" :key="item.variant.id"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors group"
            >
              <div class="relative size-10 rounded-md overflow-hidden bg-secondary/50 shrink-0 border border-zinc-100/50 dark:border-zinc-800/50">
                <img v-if="item.variant.image_url" :src="item.variant.image_url" class="size-full object-cover" />
                <span v-else class="flex size-full items-center justify-center text-sm grayscale opacity-20">👕</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-black text-foreground uppercase tracking-tight truncate">{{ item.product.name }}</p>
                <p class="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{{ item.variant.size }} / {{ item.variant.color }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <button @click="updateQuantity(idx, -1)" class="size-5 rounded border hover:bg-background text-muted-foreground flex items-center justify-center transition-colors"><Minus class="size-2.5" /></button>
                  <span class="text-[11px] font-black w-3 text-center">{{ item.quantity }}</span>
                  <button @click="updateQuantity(idx, 1)" class="size-5 rounded border hover:bg-background text-muted-foreground flex items-center justify-center transition-colors"><Plus class="size-2.5" /></button>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs font-black text-foreground">
                  {{ ((item.product.base_price + item.variant.price_adjustment) * item.quantity).toLocaleString() }}
                </p>
                <button @click="removeFromCart(idx)" class="text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5 mt-0.5">
                  <X class="size-3" />
                </button>
              </div>
            </div>
          </div>

          <div class="pt-5 border-t border-dashed border-border space-y-4">
            <div class="space-y-1.5">
              <label class="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{{ t('validation.apply_discount') }}</label>
              <select v-model="selectedDiscount"
                class="w-full h-9 rounded-md border border-input bg-background px-3 text-[11px] font-black uppercase tracking-tighter text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option :value="null">NO DISCOUNT</option>
                <option v-for="d in discounts" :key="d.id" :value="d">
                  {{ d.name }} ({{ d.type === 'percentage' ? d.value + '%' : d.value.toLocaleString() + ' Ks' }})
                </option>
              </select>
            </div>

            <div class="space-y-1.5 py-1">
              <div class="flex justify-between text-[11px] font-bold text-muted-foreground">
                <span>SUBTOTAL</span>
                <span>{{ subtotal.toLocaleString() }} Ks</span>
              </div>
              <div v-if="discountAmount > 0" class="flex justify-between text-[11px] text-primary font-black">
                <span class="flex items-center gap-1">DISCOUNT ({{ discountLabel }})</span>
                <span>-{{ discountAmount.toLocaleString() }} Ks</span>
              </div>
              <div class="flex justify-between items-end pt-1">
                <span class="text-xs font-black text-foreground uppercase tracking-widest">Total</span>
                <span class="text-2xl font-black text-foreground tracking-tighter italic">{{ totalAfterDiscount.toLocaleString() }} Ks</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2.5 pt-1">
              <div class="space-y-1">
                <label class="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Payment</label>
                <select v-model="paymentMethod" class="w-full h-8 rounded-md border border-input bg-background px-2 text-[10px] font-black uppercase tracking-tighter text-foreground outline-none">
                  <option value="cash">CASH</option>
                  <option value="transfer">TRANSFER</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Received</label>
                <Input v-model="amountReceived" type="number" min="0" step="0.01" class="h-8 text-right text-[10px] font-black tracking-tighter rounded-md" />
              </div>
            </div>

            <div v-if="parsedAmount > 0" class="flex justify-between items-center px-4 py-2.5 rounded-lg bg-secondary/50 border border-border/50">
              <span class="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Change</span>
              <span class="text-lg font-black text-foreground italic tracking-tight">{{ change.toLocaleString() }} Ks</span>
            </div>

            <Button class="w-full h-12 rounded-lg text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:translate-y-[-1px] active:translate-y-[0] transition-all" :disabled="cart.length === 0 || loading" @click="completeSale">
              {{ loading ? 'LOADING...' : t('pos.complete_sale') }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="showVariantDialog && selectedProduct" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      @click.self="showVariantDialog = false">
      <Card class="w-full max-w-sm rounded-2xl overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-200 bg-card">
        <div class="p-5 border-b flex items-center justify-between bg-muted/20">
          <div class="flex items-center gap-3">
            <div v-if="imgUrl(selectedProduct)" class="size-11 rounded-lg overflow-hidden border border-border/50">
              <img :src="imgUrl(selectedProduct)!" class="size-full object-cover" />
            </div>
            <div>
              <h3 class="font-black text-xs text-foreground uppercase tracking-tight">{{ selectedProduct.name }}</h3>
              <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{{ t('pos.choose_variant') }}</p>
            </div>
          </div>
          <button @click="showVariantDialog = false" class="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><X class="size-4" /></button>
        </div>
        <div class="p-4 space-y-2 max-h-[50vh] overflow-auto custom-scrollbar">
          <button v-for="v in selectedProduct.variants" :key="v.id"
            @click="addToCart(v)"
            class="group flex w-full items-center gap-4 rounded-xl border border-zinc-100 dark:border-zinc-800 p-3.5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 disabled:opacity-30 disabled:grayscale"
            :disabled="v.stock_quantity === 0"
          >
            <div class="relative size-10 rounded-md overflow-hidden bg-secondary border border-border/50">
              <img v-if="v.image_url" :src="v.image_url" class="size-full object-cover" />
              <span v-else class="flex size-full items-center justify-center text-xs grayscale opacity-20">👕</span>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-black text-foreground uppercase">{{ v.size }}</span>
                <span class="text-muted-foreground text-[8px]">•</span>
                <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">{{ v.color }}</span>
              </div>
              <p class="text-[9px] font-bold mt-0.5 tracking-tighter" :class="v.stock_quantity < 5 ? 'text-orange-500' : 'text-muted-foreground'">
                {{ v.stock_quantity }} IN STOCK
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs font-black text-foreground group-hover:text-primary transition-colors tracking-tight">
                {{ (selectedProduct.base_price + v.price_adjustment).toLocaleString() }} Ks
              </p>
              <Badge v-if="v.stock_quantity === 0" variant="destructive" class="mt-1 px-1.5 py-0 text-[8px] font-black uppercase">Sold Out</Badge>
            </div>
          </button>
        </div>
      </Card>
    </div>
  </div>
</template>

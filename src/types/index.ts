export type UserRole = 'root' | 'store_owner' | 'store_manager' | 'inventory_staff' | 'sales_staff'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  store_id: number | null
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  parent_id: number | null
  products_count?: number
  created_at?: string
  updated_at?: string
}

export interface Brand {
  id: number
  name: string
  slug: string
  logo_url: string | null
  products_count?: number
  created_at?: string
  updated_at?: string
}

export interface ProductVariant {
  id: number
  product_id: number
  sku: string
  size: string | null
  color: string | null
  image: string | null
  image_url: string | null
  price_adjustment: number
  purchase_price: number | null
  stock_quantity: number
  product?: Product
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: number
  category_id: number
  supplier_id?: number | null
  category?: Category
  supplier?: Supplier
  name: string
  slug: string
  description: string | null
  base_price: number
  image: string | null
  image_url: string | null
  total_stock: number
  variants: ProductVariant[]
  created_at?: string
  updated_at?: string
}

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  loyalty_points: number
  orders_count?: number
  created_at?: string
  updated_at?: string
}

export interface OrderItem {
  id: number
  product_variant_id: number
  variant?: ProductVariant
  quantity: number
  unit_price: number
  subtotal: number
}

export interface Payment {
  id: number
  order_id: number
  method: string
  amount: number
  paid_at: string | null
  created_at?: string
  updated_at?: string
}

export interface Invoice {
  id: number
  order_id: number
  order?: Order & { total_amount: number }
  invoice_number: string
  issued_date: string
  due_date: string | null
  status: string
  notes: string | null
  terms: string | null
  total_amount: number
  created_at?: string
  updated_at?: string
}

export interface Address {
  id: number
  customer_id: number
  type: string
  name: string
  phone: string
  street: string
  city: string
  state: string
  postal_code: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface Shipment {
  id: number
  order_id: number
  address_id: number
  address?: Address
  method: string
  tracking_number: string | null
  tracking_url: string | null
  shipped_at: string | null
  delivered_at: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

export interface Order {
  id: number
  user_id: number
  user?: User
  customer_id: number | null
  customer?: Customer | null
  order_number: string
  total_amount: number
  status: string
  source?: string
  notes: string | null
  items: OrderItem[]
  payment?: Payment
  invoice?: Invoice
  shipment?: Shipment
  created_at: string
  updated_at?: string
}

export interface Supplier {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  products_count?: number
  created_at?: string
  updated_at?: string
}

export interface Discount {
  id: number
  name: string
  type: 'percentage' | 'fixed'
  value: number
  applies_to: 'all' | 'category' | 'product'
  category_id: number | null
  product_id: number | null
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface StockMovement {
  id: number
  product_variant_id: number
  variant?: ProductVariant
  quantity_change: number
  reason: string
  reference_type: string | null
  reference_id: number | null
  user_id: number | null
  created_at?: string
  updated_at?: string
}

export interface AuditLog {
  id: number
  user_id: number | null
  user?: User | null
  action: string
  model_type: string
  model_id: number
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at?: string
  updated_at?: string
}

export interface CashSession {
  id: number
  user_id: number
  user?: User
  opened_at: string
  closed_at: string | null
  opening_balance: number
  closing_balance: number | null
  expected_balance: number | null
  difference: number | null
  notes: string | null
  is_open: boolean
  created_at?: string
  updated_at?: string
}

export interface DashboardSummary {
  today_sales: number
  today_orders_count: number
  active_session: CashSession | null
  total_products: number
  total_variants: number
  low_stock_count: number
  out_of_stock_count: number
  low_stock_variants: Array<{
    id: number
    sku: string
    product: string
    size: string | null
    color: string | null
    stock: number
  }>
  recent_orders: Order[]
}

export interface SalesReport {
  date_from: string
  date_to: string
  total_sales: number
  order_count: number
  average_order_value: number
  items_sold: number
  daily_breakdown: Array<{
    date: string
    total: number
    count: number
  }>
}

export interface PaginatedResponse<T> {
  data: T[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

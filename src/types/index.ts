export interface User {
  id: number
  name: string
  email: string
  role: string
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  products_count?: number
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
  variants: ProductVariant[]
}

export interface Customer {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  loyalty_points: number
  orders_count?: number
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
}

export interface Invoice {
  id: number
  order_id: number
  order?: Order
  invoice_number: string
  issued_date: string
  due_date: string | null
  status: string
  notes: string | null
  terms: string | null
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
  notes: string | null
  items: OrderItem[]
  payment?: Payment
  invoice?: Invoice
  created_at: string
}

export interface DashboardSummary {
  today_sales: number
  today_orders_count: number
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

export interface Supplier {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  products_count?: number
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

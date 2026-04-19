export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  was_price: number | null
  image_url: string | null
  images: string[] | null
  category: string | null
  stock: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  order_items?: OrderItem[]
  total: number
  status: OrderStatus
  whatsapp_sent_at: string | null
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  confirmed: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

export interface Promotion {
  id: string
  title: string
  description: string | null
  image_url: string | null
  discount_label: string | null
  badge_color: string
  is_active: boolean
  sort_order: number
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

export interface ProductStats {
  product_id: string
  product_name: string
  total_sold: number
  total_revenue: number
  image_url: string | null
}

export interface DashboardStats {
  total_orders: number
  total_revenue: number
  total_products: number
  active_products: number
  top_products: ProductStats[]
  recent_orders: Order[]
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  was_price: number | null
  category: string
  stock: number
  is_active: boolean
  image_url: string
  images: string[]
}

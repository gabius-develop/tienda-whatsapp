export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
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
  items: OrderItem[]
  total: number
  status: OrderStatus
  whatsapp_sent_at: string | null
  created_at: string
}

export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

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
  category: string
  stock: number
  is_active: boolean
  image_url: string
}

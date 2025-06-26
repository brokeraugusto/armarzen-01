export interface Category {
  id: string
  name: string
  description?: string
  icon: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost_price: number
  stock_quantity: number
  min_stock_level: number
  category_id?: string
  image_url?: string
  barcode?: string
  sku?: string
  supplier?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
  stock_movements?: StockMovement[]
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  total: number
}

export interface Sale {
  id: string
  sale_number: string
  total_amount: number
  payment_method: string
  payment_status: "pending" | "approved" | "rejected" | "cancelled"
  mercadopago_payment_id?: string
  customer_email?: string
  customer_phone?: string
  notes?: string
  created_at: string
  completed_at?: string
  items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  unit_cost: number
  total_price: number
  total_cost: number
  product?: Product
}

export interface StockMovement {
  id: string
  product_id: string
  movement_type: "in" | "out" | "adjustment" | "sale"
  quantity: number
  reason?: string
  reference_id?: string
  created_at: string
  product?: Product
}

export interface DashboardMetrics {
  todayRevenue: number
  todaySales: number
  monthRevenue: number
  monthProfit: number
  lowStockItems: number
  pendingPayments: number
}

export interface WebhookSetting {
  id: string
  event_type: string
  webhook_url: string
  is_active: boolean
  retry_attempts: number
  timeout_seconds: number
  headers?: Record<string, string>
  created_at: string
  updated_at: string
}

export interface Settings {
  store_name: string
  store_phone: string
  store_email: string
  tax_rate: string
  currency: string
  store_logo: string
  n8n_base_url: string
  n8n_webhook_token: string
  whatsapp_phone: string
  stock_alert_webhook: string
  sale_webhook: string
  daily_summary_webhook: string
}

// MercadoPago Point Types
export interface MPPointTerminal {
  id: string
  pos_id: number
  store_id: string
  external_pos_id: string
  operating_mode: "PDV" | "STANDALONE" | "UNDEFINED"
  name?: string
  status?: "online" | "offline" | "busy"
}

export interface MPPointPayment {
  id: string
  terminal_id: string
  amount: number
  description: string
  external_reference: string
  status: "pending" | "approved" | "cancelled" | "rejected"
  payment_id?: string
  created_at: string
  updated_at: string
  error_message?: string
}

export interface MPPointPaymentRequest {
  terminal_id: string
  amount: number
  description: string
  external_reference: string
  notification_url?: string
}

export interface MPPointPaymentResponse {
  id: string
  status: "pending" | "approved" | "cancelled" | "rejected"
  payment_id?: string
  error_code?: string
  error_message?: string
}

// Product Import/Export Types
export interface ProductImportResult {
  success: number
  errors: string[]
  duplicates: string[]
  warnings: string[]
}

export interface BulkActionRequest {
  action: "delete" | "activate" | "updateCategory" | "adjustPrice" | "adjustStock"
  productIds: string[]
  categoryId?: string
  priceAdjustment?: {
    percentage?: number
    fixed?: number
  }
  stockAdjustment?: {
    type: "set" | "add" | "subtract"
    quantity: number
  }
}

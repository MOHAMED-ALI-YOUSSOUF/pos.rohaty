import type { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '@/lib/constants'

export interface Restaurant { id?: string; name: string; currency: string; kitchen_printer_name?: string | null; receipt_printer_name?: string | null; enabled_payment_methods?: PaymentMethod[] | null }
export interface RestaurantTable { id: string; name: string }
export interface Category { id: string; name: string }
export interface Product { id: string; name: string; description: string | null; price: number; image_url: string | null; category_id: string }
export interface PosProfile { id: string; fullName: string; restaurantId: string; restaurantName: string; currency: string; kitchenPrinterName: string | null; receiptPrinterName: string | null; enabledPaymentMethods: PaymentMethod[] }
export interface CartItem { productId: string; productName: string; unitPrice: number; quantity: number; note?: string }
export interface OrderItem { id?: string; product_name: string; quantity: number; unit_price?: number; price?: number; total?: number; note?: string | null }
export interface Payment { id?: string; method: PaymentMethod | string; amount: number; status?: PaymentStatus | string; received_amount?: number | null; change_amount?: number | null; created_at?: string }
export interface DashboardPayment { id: string; method: PaymentMethod | string; amount: number; created_at: string }
export interface Order {
    id: string; order_number: number; status: OrderStatus | string; order_type: OrderType | string; total: number
    subtotal?: number; discount?: number; note?: string | null; created_at: string; restaurant_id?: string; table_id?: string | null
    restaurant_tables?: { name: string } | { name: string }[] | null; restaurants?: { name: string; currency?: string } | null
    order_items?: OrderItem[]; payments?: Payment[] | null; payment?: Payment | null
}
export interface PosProps { categories: Category[]; products: Product[]; tables: RestaurantTable[]; profile: PosProfile }

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CartItem } from '@/types'
import type { OrderStatus, OrderType } from '@/lib/constants'

export interface CreateOrderInput {
    restaurantId: string
    profileId: string
    tableId: string | null
    orderType: OrderType
    status: OrderStatus
    total: number
    note: string
    items: CartItem[]
}

export async function createOrder(supabase: SupabaseClient, input: CreateOrderInput) {
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            restaurant_id: input.restaurantId,
            table_id: input.tableId,
            order_type: input.orderType,
            status: input.status,
            subtotal: input.total,
            discount: 0,
            total: input.total,
            note: input.note || null,
            created_by: input.profileId,
        })
        .select()
        .single()

    if (orderError || !order) throw orderError ?? new Error('Erreur création commande')

    const { error: itemsError } = await supabase.from('order_items').insert(
        input.items.map((item) => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.unitPrice * item.quantity,
            note: item.note || null,
        }))
    )

    if (itemsError) throw itemsError
    return order
}

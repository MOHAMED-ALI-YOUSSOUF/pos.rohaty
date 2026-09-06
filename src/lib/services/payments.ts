import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentMethod } from '@/lib/constants'
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@/lib/constants'

export interface PayOrderInput {
    restaurantId: string
    profileId: string
    orderId: string
    total: number
    method: PaymentMethod
    receivedAmount: number
    changeAmount: number
}

export async function payOrder(supabase: SupabaseClient, input: PayOrderInput) {
    const { error: paymentError } = await supabase.from('payments').insert({
        restaurant_id: input.restaurantId,
        order_id: input.orderId,
        amount: input.total,
        method: input.method,
        status: PAYMENT_STATUS.PAID,
        received_amount: input.method === PAYMENT_METHOD.CASH ? input.receivedAmount : input.total,
        change_amount: input.method === PAYMENT_METHOD.CASH ? input.changeAmount : 0,
        created_by: input.profileId,
    })
    if (paymentError) throw paymentError

    const { error: orderError } = await supabase.from('orders').update({ status: ORDER_STATUS.PAID }).eq('id', input.orderId)
    if (orderError) throw orderError
}

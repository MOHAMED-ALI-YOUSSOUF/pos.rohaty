import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PaymentClient } from './payment-client'

export default async function OrderPaymentPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, restaurant_id, restaurants(name, currency)')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')

    const { data: order } = await supabase
        .from('orders')
        .select('*, restaurant_tables(name), order_items(*)')
        .eq('id', id)
        .eq('restaurant_id', profile.restaurant_id)
        .single()

    if (!order) notFound()

    return (
        <PaymentClient
            order={order}
            profileId={profile.id}
            restaurantId={profile.restaurant_id}
            currency={(profile.restaurants as any)?.currency || 'FDJ'}
            restaurantName={(profile.restaurants as any)?.name || 'Restaurant'}
        />
    )
}
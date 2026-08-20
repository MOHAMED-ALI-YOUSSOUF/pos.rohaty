import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PosOrdersClient } from './pos-orders-client'

export default async function PosOrdersPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, restaurants(currency)')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')

    const { data: orders } = await supabase
        .from('orders')
        .select('*, restaurant_tables(name), payments(method, amount)')
        .eq('restaurant_id', profile.restaurant_id)
        .in('status', ['OPEN', 'SENT_TO_KITCHEN', 'PAID'])
        .order('created_at', { ascending: false })
        .limit(50)

    return (
        <PosOrdersClient
            orders={orders || []}
            currency={(profile.restaurants as any)?.currency || 'FDJ'}
        />
    )
}
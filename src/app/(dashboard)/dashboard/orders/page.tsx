import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrdersHistoryClient } from './orders-history-client'

export default async function DashboardOrdersPage() {
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
        .select(
            `
      id,
      order_number,
      status,
      order_type,
      total,
      created_at,
      restaurant_tables(name),
      payments(method, amount)
    `
        )
        .eq('restaurant_id', profile.restaurant_id)
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <OrdersHistoryClient
            orders={orders || []}
            currency={(profile.restaurants as any)?.currency || 'FDJ'}
        />
    )
}
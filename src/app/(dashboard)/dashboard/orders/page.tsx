import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrdersHistoryClient } from './orders-history-client'
import type { Restaurant } from '@/types'
import { getHistoryRange } from '@/lib/date-range'
import { ORDER_STATUS } from '@/lib/constants'

export default async function DashboardOrdersPage({ searchParams }: { searchParams: Promise<{ period?: string | string[]; from?: string | string[]; to?: string | string[]; status?: string | string[] }> }) {
    const params = await searchParams
    const range = getHistoryRange(params.period, params.from, params.to)
    const validStatuses = Object.values(ORDER_STATUS) as string[]
    const requestedStatus = Array.isArray(params.status) ? params.status[0] : params.status
    const status = requestedStatus && validStatuses.includes(requestedStatus) ? requestedStatus : 'all'
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
    const restaurant = Array.isArray(profile.restaurants)
        ? profile.restaurants[0] as unknown as Restaurant
        : profile.restaurants as unknown as Restaurant

    let ordersQuery = supabase
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
        .gte('created_at', range.from.toISOString())
        .lte('created_at', range.to.toISOString())
        .order('created_at', { ascending: false })

    if (status !== 'all') ordersQuery = ordersQuery.eq('status', status)
    const { data: orders } = await ordersQuery.limit(500)

    return (
        <OrdersHistoryClient
            key={`${range.from.toISOString()}-${range.to.toISOString()}-${status}`}
            orders={orders || []}
            currency={restaurant?.currency || 'FDJ'}
            status={status}
            period={range.period}
            from={range.fromDate}
            to={range.toDate}
        />
    )
}

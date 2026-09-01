import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CashClient } from './cash-client'
import type { Restaurant } from '@/types'
import { getHistoryRange } from '@/lib/date-range'

export default async function CashPage({ searchParams }: { searchParams: Promise<{ period?: string | string[]; from?: string | string[]; to?: string | string[] }> }) {
    const params = await searchParams
    const range = getHistoryRange(params.period, params.from, params.to)
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, restaurant_id, restaurants(currency)')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')
    const restaurant = Array.isArray(profile.restaurants)
        ? profile.restaurants[0] as unknown as Restaurant
        : profile.restaurants as unknown as Restaurant

    const [{ data: movements }, { data: payments }] = await Promise.all([
        supabase
            .from('cash_movements')
            .select('*')
            .eq('restaurant_id', profile.restaurant_id)
            .eq('type', 'CASH_OUT')
            .gte('created_at', range.from.toISOString())
            .lte('created_at', range.to.toISOString())
            .order('created_at', { ascending: false }),
        supabase
            .from('payments')
            .select('amount, method, created_at')
            .eq('restaurant_id', profile.restaurant_id)
            .eq('method', 'CASH')
            .eq('status', 'PAID')
            .gte('created_at', range.from.toISOString())
            .lte('created_at', range.to.toISOString()),
    ])

    const cashIn = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
    const cashOut = (movements || [])
        .filter((m) => m.type === 'CASH_OUT')
        .reduce((s, m) => s + Number(m.amount || 0), 0)

    return (
        <CashClient
            key={`${range.from.toISOString()}-${range.to.toISOString()}`}
            restaurantId={profile.restaurant_id}
            profileId={profile.id}
            currency={restaurant?.currency || 'FDJ'}
            initialMovements={movements || []}
            cashIn={cashIn}
            cashOut={cashOut}
            period={range.period}
            from={range.fromDate}
            to={range.toDate}
            includesToday={range.from <= new Date() && range.to >= new Date()}
        />
    )
}

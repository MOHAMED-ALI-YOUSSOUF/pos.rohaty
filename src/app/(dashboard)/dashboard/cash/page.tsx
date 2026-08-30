import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CashClient } from './cash-client'

export default async function CashPage() {
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

    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const [{ data: movements }, { data: payments }] = await Promise.all([
        supabase
            .from('cash_movements')
            .select('*')
            .eq('restaurant_id', profile.restaurant_id)
            .gte('created_at', start.toISOString())
            .order('created_at', { ascending: false }),
        supabase
            .from('payments')
            .select('amount, method, created_at')
            .eq('restaurant_id', profile.restaurant_id)
            .eq('method', 'CASH')
            .eq('status', 'PAID')
            .gte('created_at', start.toISOString()),
    ])

    const cashIn = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
    const cashOut = (movements || [])
        .filter((m) => m.type === 'CASH_OUT')
        .reduce((s, m) => s + Number(m.amount || 0), 0)

    return (
        <CashClient
            restaurantId={profile.restaurant_id}
            profileId={profile.id}
            currency={(profile.restaurants as any)?.currency || 'FDJ'}
            initialMovements={movements || []}
            cashInToday={cashIn}
            cashOutToday={cashOut}
        />
    )
}
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardStats } from './dashboard-stats'
import type { Restaurant } from '@/types'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, restaurants(name, currency)')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')
    const restaurant = Array.isArray(profile.restaurants)
        ? profile.restaurants[0] as unknown as Restaurant
        : profile.restaurants as unknown as Restaurant

    // On charge un historique large (1 an) — filtrage côté client pour le MVP
    const from = new Date()
    from.setFullYear(from.getFullYear() - 1)

    const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total, created_at, order_type')
        .eq('restaurant_id', profile.restaurant_id)
        .gte('created_at', from.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000)

    return (
        <DashboardStats
            restaurantName={restaurant?.name || 'Restaurant'}
            currency={restaurant?.currency || 'FDJ'}
            orders={orders || []}
        />
    )
}

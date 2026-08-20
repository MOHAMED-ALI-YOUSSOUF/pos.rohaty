import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PosClient } from './pos-client'

export default async function PosPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, restaurant_id, role, restaurants(name, currency)')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')

    const restaurantId = profile.restaurant_id

    const [{ data: categories }, { data: products }, { data: tables }] =
        await Promise.all([
            supabase
                .from('categories')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true)
                .order('sort_order'),
            supabase
                .from('products')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_available', true)
                .order('sort_order'),
            supabase
                .from('restaurant_tables')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .eq('is_active', true)
                .order('name'),
        ])

    return (
        <PosClient
            categories={categories || []}
            products={products || []}
            tables={tables || []}
            profile={{
                id: profile.id,
                fullName: profile.full_name,
                restaurantId,
                restaurantName: (profile.restaurants as any)?.name || 'Restaurant',
                currency: (profile.restaurants as any)?.currency || 'FDJ',
            }}
        />
    )
}
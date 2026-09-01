import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PosClient } from './pos-client'
import type { Restaurant } from '@/types'

export default async function PosPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, restaurant_id, role, restaurants(name, currency, kitchen_printer_name, receipt_printer_name)')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')

    const restaurantId = profile.restaurant_id
    const restaurant = Array.isArray(profile.restaurants)
        ? profile.restaurants[0] as unknown as Restaurant
        : profile.restaurants as unknown as Restaurant

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
                restaurantName: restaurant?.name || 'Restaurant',
                currency: restaurant?.currency || 'FDJ',
                kitchenPrinterName: restaurant?.kitchen_printer_name || null,
                receiptPrinterName: restaurant?.receipt_printer_name || null,
            }}
        />
    )
}

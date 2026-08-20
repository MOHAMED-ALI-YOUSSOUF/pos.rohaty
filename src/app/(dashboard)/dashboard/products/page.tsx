import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductsClient } from './products-client'

export default async function ProductsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')

    const [{ data: products }, { data: categories }] = await Promise.all([
        supabase
            .from('products')
            .select('*, categories(name)')
            .eq('restaurant_id', profile.restaurant_id)
            .order('sort_order', { ascending: true }),
        supabase
            .from('categories')
            .select('id, name, is_active')
            .eq('restaurant_id', profile.restaurant_id)
            .order('sort_order', { ascending: true }),
    ])

    return (
        <ProductsClient
            initialProducts={products || []}
            categories={categories || []}
            restaurantId={profile.restaurant_id}
        />
    )
}
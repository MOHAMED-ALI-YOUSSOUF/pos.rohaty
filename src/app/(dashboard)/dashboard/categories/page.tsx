import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CategoriesClient } from './categories-client'

export default async function CategoriesPage() {
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

    const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .order('sort_order', { ascending: true })

    return (
        <CategoriesClient
            initialCategories={categories || []}
            restaurantId={profile.restaurant_id}
        />
    )
}
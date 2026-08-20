import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TablesClient } from './tables-client'

export default async function TablesPage() {
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

    const { data: tables } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id)
        .order('name', { ascending: true })

    return (
        <TablesClient
            initialTables={tables || []}
            restaurantId={profile.restaurant_id}
        />
    )
}
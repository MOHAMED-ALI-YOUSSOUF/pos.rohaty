import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, restaurant_id')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', profile.restaurant_id)
        .single()

    if (!restaurant) redirect('/login')

    return (
        <SettingsClient
            restaurant={restaurant}
            role={profile.role}
        />
    )
}
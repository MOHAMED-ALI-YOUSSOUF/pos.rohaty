import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import type { Restaurant } from '@/types'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, restaurants(*)')
        .eq('user_id', user.id)
        .single()

    if (!profile) redirect('/login')

    const restaurant = (Array.isArray(profile.restaurants) ? profile.restaurants[0] : profile.restaurants) as Restaurant | null

    async function signOut() {
        'use server'

        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="h-screen flex overflow-hidden bg-muted/30">

            {/* Sidebar desktop + mobile */}
            <Sidebar
                restaurantName={restaurant?.name || 'QRMenu'}
                fullName={profile.full_name}
                signOutAction={signOut}
            />

            {/* Zone principale */}
            <main className="flex-1 min-w-0 h-screen overflow-y-auto">

                {/* Espace pour le bouton mobile */}
                <div className="lg:hidden h-16" />

                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                    {children}
                </div>

            </main>
        </div>
    )
}


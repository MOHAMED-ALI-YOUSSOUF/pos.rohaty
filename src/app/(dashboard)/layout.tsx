import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, restaurants(*)')
        .eq('user_id', user.id)
        .single()
    if (!profile) redirect('/login')

    const restaurant = profile.restaurants as any

    async function signOut() {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="min-h-screen flex bg-muted/30">
            <Sidebar
                restaurantName={restaurant?.name || 'QRMenu'}
                fullName={profile.full_name}
                role={profile.role}
                signOutAction={signOut}
            />
            <main className="flex-1 overflow-auto min-w-0">
                <div className="lg:hidden h-16" />
                <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
            </main>
        </div>
    )
}
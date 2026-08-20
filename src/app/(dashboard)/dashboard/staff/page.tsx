// import { createClient } from '@/lib/supabase/server'
// import { redirect } from 'next/navigation'
// import { StaffClient } from './staff-client'

// export default async function StaffPage() {
//   const supabase = await createClient()

//   const {
//     data: { user },
//   } = await supabase.auth.getUser()
//   if (!user) redirect('/login')

//   const { data: profile } = await supabase
//     .from('profiles')
//     .select('id, role, restaurant_id, full_name')
//     .eq('user_id', user.id)
//     .single()

//   if (!profile) redirect('/login')

//   const { data: staff } = await supabase
//     .from('profiles')
//     .select('id, full_name, role, is_active, user_id, created_at')
//     .eq('restaurant_id', profile.restaurant_id)
//     .order('created_at', { ascending: true })

//   return (
//     <StaffClient
//       staff={staff || []}
//       currentProfileId={profile.id}
//       currentRole={profile.role}
//       restaurantId={profile.restaurant_id}
//     />
//   )
// }
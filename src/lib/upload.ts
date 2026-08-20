import { createClient } from '@/lib/supabase/client'

export async function uploadRestaurantFile(
  restaurantId: string,
  file: File,
  path: string // "logo" | "cover" | "products/xxx"
) {
  const supabase = createClient()
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()

  // Chemin stable pour pouvoir écraser
  // logo → {restaurantId}/logo.jpg
  // cover → {restaurantId}/cover.jpg
  // products/id → {restaurantId}/products/id.jpg
  const cleanPath = path.replace(/\.[^.]+$/, '')
  const fullPath = `${restaurantId}/${cleanPath}.${ext}`

  // 1. Supprimer l'ancien fichier s'il existe (ignore l'erreur s'il n'existe pas)
  await supabase.storage.from('restaurant_assets').remove([fullPath])

  // 2. Upload (écrasement autorisé)
  const { error } = await supabase.storage
    .from('restaurant_assets')
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    })

  if (error) throw error

  // 3. URL publique + anti-cache pour voir la nouvelle image tout de suite
  const { data } = supabase.storage
    .from('restaurant_assets')
    .getPublicUrl(fullPath)

  return `${data.publicUrl}?t=${Date.now()}`
}
import { createClient } from '@/lib/supabase/server'
import { PublicMenu } from './public-menu'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, description')
    .eq('slug', slug)
    .single()

  return {
    title: restaurant?.name || 'Menu',
    description: restaurant?.description || 'Consultez notre menu',
  }
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Restaurant non trouvé
        </h1>
      </div>
    )
  }

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_available', true)
      .order('sort_order', { ascending: true }),
  ])

  // Structure proche de ton ancien code Sanity
  const categoriesWithDishes = (categories || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    image_url: cat.image_url,
    dishes: (products || [])
      .filter((p) => p.category_id === cat.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        image_url: p.image_url,
      })),
  })).filter((c) => c.dishes.length > 0)

  return (
    <PublicMenu
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        logo_url: restaurant.logo_url,
        cover_url: restaurant.cover_url,
        phone: restaurant.phone,
        address: restaurant.address,
        currency: restaurant.currency || 'FDJ',
        primary_color: restaurant.primary_color || '#f97316',
      }}
      categories={categoriesWithDishes}
    />
  )
}
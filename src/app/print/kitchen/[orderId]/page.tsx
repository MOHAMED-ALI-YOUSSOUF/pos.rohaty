import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KitchenTicket } from './kitchen-ticket'
import { QzScript } from '@/components/print/qz-script'

export default async function KitchenPrintPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 1. Commande
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold">Commande introuvable</h1>
          <p className="text-sm text-muted-foreground">
            ID : {orderId}
          </p>
          <p className="text-xs text-destructive">
            {orderError?.message || 'Aucune commande avec cet ID'}
          </p>
          <a href="/pos" className="text-primary underline text-sm">
            Retour POS
          </a>
        </div>
      </div>
    )
  }

  // 2. Items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  // 3. Table (optionnel)
  let tableName: string | null = null
  if (order.table_id) {
    const { data: table } = await supabase
      .from('restaurant_tables')
      .select('name')
      .eq('id', order.table_id)
      .single()
    tableName = table?.name || null
  }

  // 4. Restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name')
    .eq('id', order.restaurant_id)
    .single()

  const ticketOrder = {
    ...order,
    restaurant_tables: tableName ? { name: tableName } : null,
    restaurants: restaurant ? { name: restaurant.name } : null,
    order_items: items || [],
  }

  return (
  <>
  <QzScript />
  <KitchenTicket order={ticketOrder} />
</>
  )
}
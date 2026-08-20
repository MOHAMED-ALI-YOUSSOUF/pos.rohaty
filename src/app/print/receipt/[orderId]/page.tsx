import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReceiptTicket } from './receipt-ticket'

export default async function ReceiptPrintPage({
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

  // Commande
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
          <p className="text-sm text-muted-foreground">ID : {orderId}</p>
          <p className="text-xs text-destructive">
            {orderError?.message || 'Aucune commande avec cet ID'}
          </p>
          <a href="/pos/orders" className="text-primary underline text-sm">
            Retour commandes
          </a>
        </div>
      </div>
    )
  }

  // Items
  const { data: items } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  // Paiement
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Table
  let tableName: string | null = null
  if (order.table_id) {
    const { data: table } = await supabase
      .from('restaurant_tables')
      .select('name')
      .eq('id', order.table_id)
      .single()
    tableName = table?.name || null
  }

  // Restaurant
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, currency')
    .eq('id', order.restaurant_id)
    .single()

  const ticketOrder = {
    ...order,
    restaurant_tables: tableName ? { name: tableName } : null,
    restaurants: restaurant
      ? { name: restaurant.name, currency: restaurant.currency }
      : null,
    order_items: items || [],
    payment: payment || null,
  }

  return <ReceiptTicket order={ticketOrder} />
}
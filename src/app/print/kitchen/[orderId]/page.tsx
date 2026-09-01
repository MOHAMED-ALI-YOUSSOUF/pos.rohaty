import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { KitchenTicket } from './kitchen-ticket'

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
    .select(`*, order_items(product_name, quantity, note), restaurant_tables(name), restaurants(name)`)
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
          <Link href="/pos" className="text-primary underline text-sm">
            Retour POS
          </Link>
        </div>
      </div>
    )
  }

  return <KitchenTicket order={order} />
}

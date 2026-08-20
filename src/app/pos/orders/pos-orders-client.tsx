'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

type Order = {
  id: string
  order_number: number
  status: string
  total: number
  order_type: string
  created_at: string
  restaurant_tables: { name: string } | null
}

export function PosOrdersClient({
  orders: initialOrders,
  currency,
}: {
  orders: Order[]
  currency: string
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelNumber, setCancelNumber] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const formatPrice = (v: number) =>
    new Intl.NumberFormat('fr-FR').format(Number(v)) + ' ' + currency

  const statusLabel: Record<string, string> = {
    OPEN: 'Ouverte',
    SENT_TO_KITCHEN: 'Cuisine',
    PAID: 'Payée',
    CANCELLED: 'Annulée',
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    OPEN: 'outline',
    SENT_TO_KITCHEN: 'default',
    PAID: 'secondary',
    CANCELLED: 'outline',
  }

  const onCancel = (id: string, number: number) => {
    setCancelId(id)
    setCancelNumber(number)
  }

  const confirmCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('orders')
      .update({ status: 'CANCELLED' })
      .eq('id', cancelId)
      .in('status', ['OPEN', 'SENT_TO_KITCHEN'])

    if (error) {
      toast.error(error.message)
      setCancelling(false)
      return
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancelId ? { ...o, status: 'CANCELLED' } : o
      )
    )
    toast.success(`Commande #${cancelNumber} annulée`)
    setCancelId(null)
    setCancelNumber(null)
    setCancelling(false)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="h-14 border-b bg-background flex items-center gap-3 px-4">
        <Button variant="ghost" size="icon" >
          <Link href="/pos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="font-semibold">Commandes</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              Aucune commande
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">#{order.order_number}</span>
                    <Badge variant={statusVariant[order.status] || 'outline'}>
                      {statusLabel[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.order_type === 'TAKEAWAY'
                      ? 'À emporter'
                      : order.restaurant_tables?.name || '—'}
                    {' · '}
                    {new Date(order.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="font-semibold mt-1">{formatPrice(order.total)}</p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                    <>
                      <Button size="sm" className="py-2">
                        <Link href={`/pos/orders/${order.id}`}>
                          <CreditCard className="mr-2 h-4 w-4 " />
                          Encaisser
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => onCancel(order.id, order.order_number)}
                      >
                        Annuler
                      </Button>
                    </>
                  )}

                  {order.status === 'PAID' && (
                    <Button variant="outline" size="sm" >
                      <Link href={`/print/receipt/${order.id}`}>Ticket</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog
        open={!!cancelId}
        onOpenChange={(open) => {
          if (!open) {
            setCancelId(null)
            setCancelNumber(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Annuler la commande #{cancelNumber} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Statut → Annulée. Aucun ticket client ne sera imprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? 'Annulation...' : 'Confirmer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'
import { formatPrice } from '@/lib/formatters'
import { PAYMENT_METHOD_LABEL } from '@/lib/constants'

type OrderItem = {
  product_name: string
  quantity: number
  unit_price: number
  total: number
  note: string | null
}

type Payment = {
  method: string
  amount: number
  received_amount: number | null
  change_amount: number | null
} | null

type Order = {
  id: string
  order_number: number
  order_type: string
  total: number
  subtotal: number
  discount: number
  note: string | null
  created_at: string
  restaurant_tables: { name: string } | null
  restaurants: { name: string; currency: string } | null
  order_items: OrderItem[]
  payment: Payment
}

export function ReceiptTicket({ order }: { order: Order }) {
  const [printing, setPrinting] = useState(false)

  const restaurantName = order.restaurants?.name || 'RESTAURANT'
  const currency = order.restaurants?.currency || 'FDJ'

  const tableLabel =
    order.order_type === 'TAKEAWAY'
      ? 'À EMPORTER'
      : order.restaurant_tables?.name || '—'

  const date = new Date(order.created_at)
  const dateStr = date.toLocaleDateString('fr-FR')
  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Impression auto à l'ouverture
  useEffect(() => {
    const timer = setTimeout(() => {
      window.print()
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handlePrint = () => {
    setPrinting(true)
    window.print()
    setTimeout(() => setPrinting(false), 1000)
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-4 print:p-0 print:bg-white">
      {/* Actions écran */}
      <div className="print:hidden max-w-[80mm] mx-auto mb-4 flex gap-2">
        <Button variant="outline"  className="flex-1">
          <Link href="/pos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Commandes
          </Link>
        </Button>
        <Button className="flex-1" onClick={handlePrint} disabled={printing}>
          <Printer className="mr-2 h-4 w-4" />
          {printing ? 'Impression...' : 'Imprimer'}
        </Button>
      </div>

      {/* Ticket client */}
      <div className="ticket mx-auto bg-white shadow-md print:shadow-none">
        {/* En-tête */}
        <div className="px-3 pt-4 pb-2 text-center">
          <p className="text-base font-black tracking-wide uppercase">
            {restaurantName}
          </p>
          <p className="text-[11px] tracking-[0.15em] uppercase text-neutral-500 mt-1">
            Ticket client
          </p>
        </div>

        <div className="mx-3 border-t border-dashed border-neutral-400" />

        {/* Infos */}
        <div className="px-3 py-3 space-y-0.5 text-sm">
          <div className="flex justify-between">
            <span className="font-bold">CMD #{order.order_number}</span>
            <span className="text-xs">{timeStr}</span>
          </div>
          <p className="font-semibold uppercase">{tableLabel}</p>
          <p className="text-xs text-neutral-600">{dateStr}</p>
        </div>

        <div className="mx-3 border-t border-dashed border-neutral-400" />

        {/* Articles avec prix */}
        <div className="px-3 py-3 space-y-2">
          {(order.order_items || []).map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-semibold leading-tight">
                  {item.quantity}× {item.product_name}
                </span>
                <span className="font-medium shrink-0">
                  {formatPrice(Number(item.total), currency)}
                </span>
              </div>
              {item.note && (
                <p className="text-xs text-neutral-600 pl-1">→ {item.note}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mx-3 border-t border-dashed border-neutral-400" />

        {/* Totaux */}
        <div className="px-3 py-3 space-y-1 text-sm">
          {Number(order.discount) > 0 && (
            <>
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{formatPrice(Number(order.subtotal), currency)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Remise</span>
                <span>-{formatPrice(Number(order.discount), currency)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-base font-black pt-1">
            <span>TOTAL</span>
            <span>{formatPrice(Number(order.total), currency)}</span>
          </div>
        </div>

        {/* Paiement */}
        {order.payment && (
          <>
            <div className="mx-3 border-t border-dashed border-neutral-400" />
            <div className="px-3 py-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Paiement</span>
                <span className="font-semibold">
                    {PAYMENT_METHOD_LABEL[order.payment.method] || order.payment.method}
                </span>
              </div>
              {order.payment.method === 'CASH' && (
                <>
                  <div className="flex justify-between text-neutral-600">
                    <span>Reçu</span>
                    <span>
                      {formatPrice(Number(order.payment.received_amount || 0), currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Rendu</span>
                    <span>
                      {formatPrice(Number(order.payment.change_amount || 0), currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className="mx-3 border-t border-dashed border-neutral-400" />

        {/* Message */}
        <div className="px-3 py-4 text-center space-y-1">
          <p className="text-sm font-bold uppercase tracking-wide">
            Merci et à bientôt !
          </p>
          <p className="text-[10px] text-neutral-500 tracking-wider uppercase">
            — {restaurantName} —
          </p>
        </div>
      </div>

      <div className="print:hidden max-w-[80mm] mx-auto mt-4 flex gap-2">
        <Button variant="outline"  className="flex-1">
          <Link href="/pos">Nouvelle commande</Link>
        </Button>
      </div>
    </div>
  )
}

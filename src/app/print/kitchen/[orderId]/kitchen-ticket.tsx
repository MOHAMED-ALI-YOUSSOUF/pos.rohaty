'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type OrderItem = {
    product_name: string
    quantity: number
    note: string | null
}

type Order = {
    id: string
    order_number: number
    order_type: string
    note: string | null
    created_at: string
    restaurant_tables: { name: string } | null
    restaurants: { name: string } | null
    order_items: OrderItem[]
}

export function KitchenTicket({ order }: { order: Order }) {
    const [printing, setPrinting] = useState(false)

    const restaurantName = order.restaurants?.name || 'RESTAURANT'
    const tableLabel =
        order.order_type === 'TAKEAWAY'
            ? 'A EMPORTER'
            : (order.restaurant_tables?.name || 'TABLE').toUpperCase()

    const date = new Date(order.created_at)
    const dateStr = date.toLocaleDateString('fr-FR')
    const timeStr = date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    const handlePrint = () => {
        setPrinting(true)
        try {
            window.print()
            toast.success('Impression lancée')
        } catch (err: unknown) {
            console.error(err)
            toast.error(err instanceof Error ? err.message : 'Erreur impression')
        } finally {
            setPrinting(false)
        }
    }

    // Impression auto au chargement
    useEffect(() => {
        const t = setTimeout(() => {
            handlePrint()
        }, 600)
        return () => clearTimeout(t)
    }, [])

    return (
        <div className="min-h-screen bg-neutral-100 p-4 print:p-0 print:bg-white">
            {/* Barre actions (écran seulement) */}
            <div className="print:hidden max-w-[80mm] mx-auto mb-4 space-y-3">
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" render={<Link href="/pos" />}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            POS
                    </Button>
                    <Button className="flex-1" onClick={handlePrint} disabled={printing}>
                        <Printer className="mr-2 h-4 w-4" />
                        {printing ? 'Impression...' : 'Réimprimer'}
                    </Button>
                </div>
            </div>

            {/* Ticket */}
            <div className="ticket mx-auto bg-white shadow-md print:shadow-none">
                {/* En-tête */}
                <div className="px-3 pt-4 pb-2 text-center">
                    <p className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">
                        Cuisine
                    </p>
                    <p className="text-base font-black tracking-wide uppercase mt-1">
                        {restaurantName}
                    </p>
                    <p className="text-lg font-black mt-1">TICKET CUISINE</p>
                </div>

                <div className="mx-3 border-t border-dashed border-neutral-400" />

                {/* Infos commande */}
                <div className="px-3 py-3 space-y-1">
                    <div className="flex justify-between items-baseline">
                        <span className="text-xl font-black">#{order.order_number}</span>
                        <span className="text-sm font-bold">{timeStr}</span>
                    </div>
                    <p className="text-base font-black uppercase tracking-wide">
                        {tableLabel}
                    </p>
                    <p className="text-xs text-neutral-600">{dateStr}</p>
                </div>

                <div className="mx-3 border-t border-dashed border-neutral-400" />

                {/* Articles */}
                <div className="px-3 py-3 space-y-3">
                    {(order.order_items || []).map((item, idx) => (
                        <div key={idx}>
                            <p className="text-[15px] font-black leading-tight">
                                {item.quantity}× {item.product_name.toUpperCase()}
                            </p>
                            {item.note && (
                                <p className="text-xs mt-0.5 pl-1 text-neutral-700">
                                    → {item.note}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Note globale */}
                {order.note && (
                    <>
                        <div className="mx-3 border-t border-dashed border-neutral-400" />
                        <div className="px-3 py-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                Note
                            </p>
                            <p className="text-sm font-bold uppercase mt-1">{order.note}</p>
                        </div>
                    </>
                )}

                <div className="mx-3 border-t border-dashed border-neutral-400" />

                <div className="px-3 py-4 text-center">
                    <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-500">
                        — Fin du ticket —
                    </p>
                </div>
            </div>
        </div>
    )
}

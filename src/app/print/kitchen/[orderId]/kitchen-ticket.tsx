'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react'
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

declare global {
    interface Window {
        qz?: any
    }
}

export function KitchenTicket({ order }: { order: Order }) {
    const router = useRouter()
    const [printing, setPrinting] = useState(false)
    const [qzReady, setQzReady] = useState(false)

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

    // Détecter QZ Tray
    useEffect(() => {
        const check = () => {
            if (typeof window !== 'undefined' && window.qz) {
                setQzReady(true)
            }
        }
        check()
        const t = setInterval(check, 1000)
        return () => clearInterval(t)
    }, [])

    // Impression auto au chargement
    useEffect(() => {
        const t = setTimeout(() => {
            handlePrint()
        }, 600)
        return () => clearTimeout(t)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const buildEscPos = () => {
        const lines: string[] = []
        const center = '\x1Ba\x01'
        const left = '\x1Ba\x00'
        const boldOn = '\x1B\x45\x01'
        const boldOff = '\x1B\x45\x00'
        const doubleOn = '\x1D\x21\x11'
        const doubleOff = '\x1D\x21\x00'
        const cut = '\x1D\x56\x00'
        const line = '--------------------------------'

        lines.push(center + boldOn + doubleOn)
        lines.push(restaurantName.toUpperCase())
        lines.push(doubleOff + boldOff)
        lines.push('TICKET CUISINE')
        lines.push(left)
        lines.push(line)
        lines.push(boldOn + `CMD #${order.order_number}` + boldOff)
        lines.push(boldOn + tableLabel + boldOff)
        lines.push(`${dateStr}  ${timeStr}`)
        lines.push(line)

        for (const item of order.order_items || []) {
            lines.push(boldOn + `${item.quantity} x ${item.product_name.toUpperCase()}` + boldOff)
            if (item.note) lines.push(`  -> ${item.note}`)
        }

        if (order.note) {
            lines.push(line)
            lines.push(boldOn + 'NOTE:' + boldOff)
            lines.push(order.note.toUpperCase())
        }

        lines.push(line)
        lines.push(center + 'MERCI' + left)
        lines.push('\n\n\n')
        lines.push(cut)

        return lines
    }

    const printWithQz = async () => {
        const qz = window.qz
        if (!qz) throw new Error('QZ Tray non détecté')

        if (!qz.websocket.isActive()) {
            await qz.websocket.connect()
        }

        // Nom de l'imprimante (à adapter, ou laisser QZ choisir la défaut)
        const printers = await qz.printers.find()
        const printer =
            printers.find((p: string) =>
                /thermal|ticket|pos|epson|xprinter|rongta|star/i.test(p)
            ) || printers[0]

        if (!printer) throw new Error('Aucune imprimante trouvée')

        const config = qz.configs.create(printer, {
            encoding: 'UTF-8',
            altPrinting: true,
        })

        const data = [
            {
                type: 'raw',
                format: 'command',
                data: buildEscPos().join('\n'),
            },
        ]

        await qz.print(config, data)
    }

    const handlePrint = async () => {
        setPrinting(true)
        try {
            if (window.qz) {
                await printWithQz()
                toast.success('Ticket envoyé à l’imprimante')
            } else {
                // Fallback navigateur
                window.print()
            }
        } catch (err: any) {
            console.error(err)
            toast.error(err?.message || 'Erreur impression')
            // Fallback
            window.print()
        } finally {
            setPrinting(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-100 p-4 print:p-0 print:bg-white">
            {/* Barre actions (écran seulement) */}
            <div className="print:hidden max-w-[80mm] mx-auto mb-4 space-y-3">
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                        <Link href="/pos">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            POS
                        </Link>
                    </Button>
                    <Button className="flex-1" onClick={handlePrint} disabled={printing}>
                        <Printer className="mr-2 h-4 w-4" />
                        {printing ? 'Impression...' : 'Réimprimer'}
                    </Button>
                </div>

                <div
                    className={`rounded-lg border px-3 py-2 text-xs flex items-center gap-2 ${qzReady
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                >
                    {qzReady ? (
                        <>
                            <CheckCircle2 className="h-4 w-4" />
                            QZ Tray connecté — impression directe thermique
                        </>
                    ) : (
                        <>
                            Mode navigateur — installez QZ Tray pour l’impression directe
                        </>
                    )}
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
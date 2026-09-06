'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { ArrowLeft, CreditCard, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import { ORDER_STATUS, ORDER_TYPE, PAYMENT_METHOD, PAYMENT_METHODS } from '@/lib/constants'
import type { PaymentMethod } from '@/lib/constants'
import type { Order, OrderItem } from '@/types'
import { payOrder } from '@/lib/services/payments'
import { printReceipt } from '@/lib/printing/qz'

type OrderRow = Order & { restaurant_tables: { name: string } | null }

function matchesTableQuery(order: OrderRow, q: string) {
    if (!q) return true
    if (order.order_type === ORDER_TYPE.TAKEAWAY) {
        return (
            'à emporter'.includes(q) ||
            'emporter'.includes(q) ||
            'takeaway'.includes(q)
        )
    }
    const name = order.restaurant_tables?.name?.toLowerCase() || ''
    return name.includes(q)
}

export function PosOrdersPanel({
    restaurantId,
    profileId,
    currency,
    restaurantName,
    receiptPrinterName,
    enabledPaymentMethods,
    onBackToCart,
}: {
    restaurantId: string
    profileId: string
    currency: string
    restaurantName: string
    receiptPrinterName: string | null
    enabledPaymentMethods: PaymentMethod[]
    onBackToCart: () => void
}) {
    const paymentMethods = PAYMENT_METHODS.filter(({ id }) => enabledPaymentMethods.includes(id))
    const defaultPaymentMethod = paymentMethods[0]?.id ?? PAYMENT_METHOD.CASH
    const [orders, setOrders] = useState<OrderRow[]>([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState<'list' | 'pay'>('list')
    const [selected, setSelected] = useState<OrderRow | null>(null)
    const [items, setItems] = useState<OrderItem[]>([])
    const [method, setMethod] = useState<PaymentMethod>(defaultPaymentMethod)
    const [received, setReceived] = useState('')
    const [paying, setPaying] = useState(false)
    const [cancelId, setCancelId] = useState<string | null>(null)
    const [cancelNumber, setCancelNumber] = useState<number | null>(null)
    const [cancelling, setCancelling] = useState(false)
    const [tableQuery, setTableQuery] = useState('')

    const loadOrders = useCallback(async () => {
        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('orders')
            .select(
                'id, order_number, status, total, order_type, created_at, restaurant_tables(name)'
            )
            .eq('restaurant_id', restaurantId)
            .in('status', [ORDER_STATUS.OPEN, ORDER_STATUS.SENT_TO_KITCHEN, ORDER_STATUS.PAID])
            .order('created_at', { ascending: false })
            .limit(40)

        if (error) toast.error(error.message)
        setOrders((data || []) as OrderRow[])
        setLoading(false)
    }, [restaurantId])

    useEffect(() => {
        const pending = Promise.resolve().then(loadOrders)
        return () => { void pending }
    }, [loadOrders])

    const openOrders = useMemo(
        () =>
            orders.filter(
                (o) => o.status === ORDER_STATUS.OPEN || o.status === ORDER_STATUS.SENT_TO_KITCHEN
            ),
        [orders]
    )

    const paidOrders = useMemo(
        () => orders.filter((o) => o.status === ORDER_STATUS.PAID).slice(0, 10),
        [orders]
    )

    const filteredOpenOrders = useMemo(() => {
        const q = tableQuery.trim().toLowerCase()
        if (!q) return openOrders
        return openOrders.filter((order) => matchesTableQuery(order, q))
    }, [openOrders, tableQuery])

    const filteredPaidOrders = useMemo(() => {
        const q = tableQuery.trim().toLowerCase()
        if (!q) return paidOrders
        return paidOrders.filter((order) => matchesTableQuery(order, q))
    }, [paidOrders, tableQuery])

    const startPay = async (order: OrderRow) => {
        setSelected(order)
        setMethod(defaultPaymentMethod)
        setReceived('')
        setView('pay')

        const supabase = createClient()
        const { data } = await supabase
            .from('order_items')
            .select('product_name, quantity, unit_price, total')
            .eq('order_id', order.id)

        setItems(data || [])
    }

    const total = Number(selected?.total || 0)
    const receivedNum = parseFloat(received) || 0
    const change = method === 'CASH' ? Math.max(0, receivedNum - total) : 0
    const canPay =
        !!selected &&
        selected.status !== 'PAID' &&
        (method !== 'CASH' || receivedNum >= total)

    const handlePay = async () => {
        if (!selected || !canPay) return
        setPaying(true)
        const supabase = createClient()

        try {
            await payOrder(supabase, { restaurantId, profileId, orderId: selected.id, total, method, receivedAmount: receivedNum, changeAmount: change })
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Erreur encaissement')
            setPaying(false)
            return
        }

        toast.success(`Commande #${selected.order_number} payée`)
        try {
            await printReceipt(receiptPrinterName, {
                restaurantName, orderNumber: selected.order_number,
                tableLabel: selected.order_type === ORDER_TYPE.TAKEAWAY ? 'À emporter' : selected.restaurant_tables?.name || 'Table', createdAt: selected.created_at,
                items: items.map(item => ({ name: item.product_name, quantity: item.quantity, unitPrice: item.unit_price, total: item.total, note: item.note })),
                currency, subtotal: total, discount: 0, total, paymentMethod: method,
                receivedAmount: method === PAYMENT_METHOD.CASH ? receivedNum : total,
                changeAmount: method === PAYMENT_METHOD.CASH ? change : 0,
            })
            toast.success('Ticket client imprimé')
        } catch (error: unknown) {
            toast.error('Paiement enregistré, mais impression du reçu impossible.')
            console.error(error)
            window.open(`/print/receipt/${selected.id}`, '_blank', 'noopener,width=420,height=720')
        }
        setPaying(false)
        setView('list')
        setSelected(null)
        loadOrders()
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

        toast.success(`Commande #${cancelNumber} annulée`)
        setCancelId(null)
        setCancelNumber(null)
        setCancelling(false)
        if (selected?.id === cancelId) {
            setView('list')
            setSelected(null)
        }
        loadOrders()
    }

    // ---------- Vue encaissement ----------
    if (view === 'pay' && selected) {
        return (
            <div className="flex flex-col h-full min-h-0 overflow-hidden">
                <div className="p-3 border-b flex items-center gap-2 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                            setView('list')
                            setSelected(null)
                        }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">Encaissement</p>
                        <p className="text-xs text-muted-foreground">
                            #{selected.order_number}
                        </p>
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="p-3 space-y-3">
                        {items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm gap-2">
                                <span className="min-w-0 break-words">
                                    {item.quantity}× {item.product_name}
                                </span>
                                <span className="font-medium shrink-0">
                                    {formatPrice(Number(item.total), currency)}
                                </span>
                            </div>
                        ))}

                        <div className="border-t pt-3 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(total, currency)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            {paymentMethods.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMethod(m.id)}
                                    className={cn(
                                        'h-10 rounded-lg border text-sm font-medium',
                                        method === m.id
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'hover:bg-muted'
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {method === 'CASH' && (
                            <div className="space-y-2 pt-2">
                                <Label>Montant reçu</Label>
                                <Input
                                    type="number"
                                    min={total}
                                    value={received}
                                    onChange={(e) => setReceived(e.target.value)}
                                    className="h-11 text-lg"
                                    placeholder={String(total)}
                                />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Rendu</span>
                                    <span className="font-bold">{formatPrice(change, currency)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-3 border-t space-y-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <Button
                        className="w-full h-12 font-semibold"
                        disabled={!canPay || paying}
                        onClick={handlePay}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {paying ? 'Encaissement...' : 'Encaisser'}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-destructive"
                        onClick={() => {
                            setCancelId(selected.id)
                            setCancelNumber(selected.order_number)
                        }}
                    >
                        Annuler la commande
                    </Button>
                </div>

                <CancelDialog
                    open={!!cancelId}
                    number={cancelNumber}
                    loading={cancelling}
                    onClose={() => setCancelId(null)}
                    onConfirm={confirmCancel}
                />
            </div>
        )
    }

    // ---------- Vue liste ----------
    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between gap-2 shrink-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Commandes
                </p>
                <Button variant="ghost" size="sm" onClick={onBackToCart}>
                    Nouvelle
                </Button>
            </div>

            <div className="p-3 border-b shrink-0">
                <Input
                    value={tableQuery}
                    onChange={(e) => setTableQuery(e.target.value)}
                    placeholder="Rechercher table… (ex: 3, Terrasse)"
                    className="h-9"
                />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="p-3 space-y-4">
                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Chargement…
                        </p>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs font-semibold mb-2">À encaisser</p>
                                {filteredOpenOrders.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Aucune</p>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredOpenOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="rounded-lg border p-3 space-y-2"
                                            >
                                                <div className="flex justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-sm">
                                                            #{order.order_number}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {order.order_type === 'TAKEAWAY'
                                                                ? 'À emporter'
                                                                : order.restaurant_tables?.name || '—'}
                                                            {' · '}
                                                            {new Date(order.created_at).toLocaleTimeString(
                                                                'fr-FR',
                                                                { hour: '2-digit', minute: '2-digit' }
                                                            )}
                                                        </p>
                                                    </div>
                                                    <Badge variant="default">Cuisine</Badge>
                                                </div>
                                                <p className="font-semibold text-sm">
                                                    {formatPrice(order.total, currency)}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => startPay(order)}
                                                    >
                                                        Encaisser
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            window.open(
                                                                `/print/kitchen/${order.id}`,
                                                                '_blank',
                                                                'noopener,width=420,height=720'
                                                            )
                                                        }
                                                    >
                                                        <Printer className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            setCancelId(order.id)
                                                            setCancelNumber(order.order_number)
                                                        }}
                                                    >
                                                        Annuler
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {filteredPaidOrders.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold mb-2">Payées (récentes)</p>
                                    <div className="space-y-2">
                                        {filteredPaidOrders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="rounded-lg border p-3 flex items-center justify-between gap-2"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm">
                                                        #{order.order_number}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {order.order_type === 'TAKEAWAY'
                                                            ? 'À emporter'
                                                            : order.restaurant_tables?.name || '—'}
                                                        {' · '}
                                                        {formatPrice(order.total, currency)}
                                                    </p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        window.open(
                                                            `/print/receipt/${order.id}`,
                                                            '_blank',
                                                            'noopener,width=420,height=720'
                                                        )
                                                    }
                                                >
                                                    Ticket
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <CancelDialog
                open={!!cancelId}
                number={cancelNumber}
                loading={cancelling}
                onClose={() => setCancelId(null)}
                onConfirm={confirmCancel}
            />
        </div>
    )
}

function CancelDialog({
    open,
    number,
    loading,
    onClose,
    onConfirm,
}: {
    open: boolean
    number: number | null
    loading: boolean
    onClose: () => void
    onConfirm: () => void
}) {
    return (
        <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Annuler la commande #{number} ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Statut → Annulée. Pas de ticket client.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Retour</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? 'Annulation...' : 'Confirmer'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

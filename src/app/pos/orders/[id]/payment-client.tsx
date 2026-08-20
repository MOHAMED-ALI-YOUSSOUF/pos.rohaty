'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { printCustomerReceipt } from '@/lib/print'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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

const METHODS = [
    { id: 'CASH', label: 'Espèces' },
    { id: 'DMONEY', label: 'D-Money' },
    { id: 'WAAFI', label: 'Waafi' },
    { id: 'CARD', label: 'Carte' },
    { id: 'OTHER', label: 'Autre' },
] as const

type OrderItem = {
    product_name: string
    quantity: number
    unit_price: number
    total: number
}

type Order = {
    id: string
    order_number: number
    status: string
    total: number
    order_type: string
    restaurant_tables: { name: string } | null
    order_items: OrderItem[]
}

export function PaymentClient({
    order,
    profileId,
    restaurantId,
    currency,
    restaurantName,
}: {
    order: Order
    profileId: string
    restaurantId: string
    currency: string
    restaurantName: string
}) {
    const router = useRouter()
    const [method, setMethod] = useState<string>('CASH')
    const [received, setReceived] = useState('')
    const [loading, setLoading] = useState(false)
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelling, setCancelling] = useState(false)

    const total = Number(order.total)
    const receivedNum = parseFloat(received) || 0
    const change = useMemo(
        () => (method === 'CASH' ? Math.max(0, receivedNum - total) : 0),
        [method, receivedNum, total]
    )

    const formatPrice = (v: number) =>
        new Intl.NumberFormat('fr-FR').format(v) + ' ' + currency

    const canPay =
        order.status !== 'PAID' &&
        order.status !== 'CANCELLED' &&
        (method !== 'CASH' || receivedNum >= total)

    const handlePay = async () => {
        if (!canPay) {
            toast.error(
                method === 'CASH'
                    ? 'Montant reçu insuffisant'
                    : 'Paiement impossible'
            )
            return
        }

        setLoading(true)
        const supabase = createClient()

        // 1. Payment
        const { error: payError } = await supabase.from('payments').insert({
            restaurant_id: restaurantId,
            order_id: order.id,
            amount: total,
            method,
            status: 'PAID',
            received_amount: method === 'CASH' ? receivedNum : total,
            change_amount: method === 'CASH' ? change : 0,
            created_by: profileId,
        })

        if (payError) {
            toast.error(payError.message)
            setLoading(false)
            return
        }

        // 2. Order → PAID
        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'PAID' })
            .eq('id', order.id)

        if (orderError) {
            toast.error(orderError.message)
            setLoading(false)
            return
        }

        toast.success('Paiement accepté')
        setLoading(false)

        // 3. Ticket client uniquement après paiement
        router.push(printCustomerReceipt(order.id))
    }

    const handleCancel = async () => {
        setCancelling(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('orders')
            .update({ status: 'CANCELLED' })
            .eq('id', order.id)
            .in('status', ['OPEN', 'SENT_TO_KITCHEN'])

        if (error) {
            toast.error(error.message)
            setCancelling(false)
            return
        }

        toast.success('Commande annulée')
        setCancelling(false)
        setCancelOpen(false)
        router.push('/pos/orders')
        router.refresh()
    }

    if (order.status === 'PAID') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center space-y-4">
                        <p className="text-lg font-semibold">Commande déjà payée</p>
                        <Button >
                            <Link href={printCustomerReceipt(order.id)}>Voir ticket client</Link>
                        </Button>
                        <Button variant="outline" >
                            <Link href="/pos/orders">Retour</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <header className="h-14 border-b bg-background flex items-center gap-3 px-4">
                <Button variant="ghost" size="icon" >
                    <Link href="/pos/orders">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="font-semibold">Encaissement</h1>
                    <p className="text-xs text-muted-foreground">
                        #{order.order_number} ·{' '}
                        {order.order_type === 'TAKEAWAY'
                            ? 'À emporter'
                            : order.restaurant_tables?.name || '—'}
                    </p>
                </div>
                {order.status !== 'PAID' && order.status !== 'CANCELLED' && (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => setCancelOpen(true)}
                    >
                        Annuler la commande
                    </Button>
                )}
            </header>

            <div className="p-4 max-w-lg mx-auto space-y-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">{restaurantName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {order.order_items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span>
                                    {item.quantity}× {item.product_name}
                                </span>
                                <span className="font-medium">
                                    {formatPrice(Number(item.total))}
                                </span>
                            </div>
                        ))}
                        <div className="border-t pt-3 flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(total)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Mode de paiement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {METHODS.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMethod(m.id)}
                                    className={cn(
                                        'h-11 rounded-lg border text-sm font-medium transition-colors',
                                        method === m.id
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background hover:bg-muted'
                                    )}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {method === 'CASH' && (
                            <div className="space-y-3 pt-2">
                                <div className="space-y-2">
                                    <Label>Montant reçu</Label>
                                    <Input
                                        type="number"
                                        min={total}
                                        step="1"
                                        value={received}
                                        onChange={(e) => setReceived(e.target.value)}
                                        placeholder={String(total)}
                                        className="text-lg h-12"
                                    />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Rendu</span>
                                    <span className="font-bold text-lg">{formatPrice(change)}</span>
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full h-12 text-base font-semibold"
                            disabled={!canPay || loading}
                            onClick={handlePay}
                        >
                            {loading ? 'Encaissement...' : 'Encaisser'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Annuler la commande #{order.order_number} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est définitive. Aucun ticket client ne sera imprimé.
                            La cuisine a éventuellement déjà reçu le ticket.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>Retour</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {cancelling ? 'Annulation...' : 'Confirmer l’annulation'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
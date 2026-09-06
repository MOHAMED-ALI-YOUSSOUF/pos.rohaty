'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { formatPrice } from '@/lib/formatters'
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/lib/constants'
import { PeriodFilter } from '@/components/dashboard/period-filter'
import type { HistoryPeriod } from '@/lib/date-range'

type Order = {
    id: string
    order_number: number
    status: string
    order_type: string
    total: number
    created_at: string
    restaurant_tables: { name: string } | { name: string }[] | null
    payments: { method: string; amount: number }[] | null
}

export function OrdersHistoryClient({
    orders,
    currency,
    status,
    period,
    from,
    to,
}: {
    orders: Order[]
    currency: string
    status: string
    period: HistoryPeriod
    from: string
    to: string
}) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const setStatus = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') params.delete('status'); else params.set('status', value)
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
                    <p className="text-muted-foreground mt-1">
                        Historique des ventes
                    </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                <PeriodFilter period={period} from={from} to={to} />
                <Select value={status} onValueChange={(value) => setStatus(value ?? 'all')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrer" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="SENT_TO_KITCHEN">Cuisine</SelectItem>
                        <SelectItem value="PAID">Payées</SelectItem>
                        <SelectItem value="OPEN">Ouvertes</SelectItem>
                        <SelectItem value="CANCELLED">Annulées</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">
                        {orders.length} commande{orders.length !== 1 ? 's' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {orders.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-10">
                            Aucune commande
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead>Table</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Paiement</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const payment = order.payments?.[0]
                                    const table = Array.isArray(order.restaurant_tables) ? order.restaurant_tables[0] : order.restaurant_tables
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                #{order.order_number}
                                            </TableCell>
                                            <TableCell>
                                                {order.order_type === 'TAKEAWAY'
                                                    ? 'À emporter'
                                                    : table?.name || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        order.status === 'PAID'
                                                            ? 'secondary'
                                                            : order.status === 'SENT_TO_KITCHEN'
                                                                ? 'default'
                                                                : 'outline'
                                                    }
                                                >
                                                    {ORDER_STATUS_LABEL[order.status] || order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {payment
                                                    ? PAYMENT_METHOD_LABEL[payment.method] || payment.method
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatPrice(order.total, currency)}
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                {new Date(order.created_at).toLocaleString('fr-FR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {order.status === 'PAID' ? (
                                                    <Button variant="ghost" size="sm" >
                                                        <Link href={`/print/receipt/${order.id}`}>
                                                            Ticket
                                                        </Link>
                                                    </Button>
                                                ) : order.status !== 'CANCELLED' ? (
                                                    <Button variant="ghost" size="sm" >
                                                        <Link href="/pos">
                                                            Encaisser
                                                        </Link>
                                                    </Button>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

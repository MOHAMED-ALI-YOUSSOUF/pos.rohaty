'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
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

type Order = {
    id: string
    order_number: number
    status: string
    order_type: string
    total: number
    created_at: string
    restaurant_tables: { name: string } | null
    payments: { method: string; amount: number }[] | null
}

const STATUS_LABEL: Record<string, string> = {
    OPEN: 'Ouverte',
    SENT_TO_KITCHEN: 'Cuisine',
    PAID: 'Payée',
    CANCELLED: 'Annulée',
}

const METHOD_LABEL: Record<string, string> = {
    CASH: 'Espèces',
    DMONEY: 'D-Money',
    WAAFI: 'Waafi',
    CARD: 'Carte',
    OTHER: 'Autre',
}

export function OrdersHistoryClient({
    orders,
    currency,
}: {
    orders: Order[]
    currency: string
}) {
    const [statusFilter, setStatusFilter] = useState<string>('all')

    const filtered = useMemo(() => {
        if (statusFilter === 'all') return orders
        return orders.filter((o) => o.status === statusFilter)
    }, [orders, statusFilter])

    const formatPrice = (v: number) =>
        new Intl.NumberFormat('fr-FR').format(Number(v)) + ' ' + currency

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
                    <p className="text-muted-foreground mt-1">
                        Historique des ventes
                    </p>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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

            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-medium">
                        {filtered.length} commande{filtered.length !== 1 ? 's' : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
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
                                {filtered.map((order) => {
                                    const payment = order.payments?.[0]
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                #{order.order_number}
                                            </TableCell>
                                            <TableCell>
                                                {order.order_type === 'TAKEAWAY'
                                                    ? 'À emporter'
                                                    : order.restaurant_tables?.name || '—'}
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
                                                    {STATUS_LABEL[order.status] || order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {payment
                                                    ? METHOD_LABEL[payment.method] || payment.method
                                                    : '—'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatPrice(order.total)}
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
                                                        <Link href={`/pos/orders/${order.id}`}>
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
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    TrendingUp,
    ShoppingBag,
    Clock,
    CheckCircle2,
    XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'

type Order = {
    id: string
    status: string
    total: number
    created_at: string
    order_type: string
}

type Period = 'today' | 'yesterday' | 'custom'

function startOfDay(d: Date) {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x
}

function endOfDay(d: Date) {
    const x = new Date(d)
    x.setHours(23, 59, 59, 999)
    return x
}

function getRange(period: Period, customFrom?: string, customTo?: string) {
    const now = new Date()

    if (period === 'today') {
        return { from: startOfDay(now), to: endOfDay(now) }
    }
    if (period === 'yesterday') {
        const y = new Date(now)
        y.setDate(y.getDate() - 1)
        return { from: startOfDay(y), to: endOfDay(y) }
    }
    // custom
    const from = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(now)
    const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now)
    return { from, to }
}

const PERIODS: { id: Period; label: string }[] = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'yesterday', label: 'Hier' },
    { id: 'custom', label: 'Personnalisé' },
]

export function DashboardStats({
    restaurantName,
    currency,
    orders,
}: {
    restaurantName: string
    currency: string
    orders: Order[]
}) {
    const [period, setPeriod] = useState<Period>('today')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')

    const { from, to } = useMemo(
        () => getRange(period, customFrom, customTo),
        [period, customFrom, customTo]
    )

    const filtered = useMemo(() => {
        return orders.filter((o) => {
            const t = new Date(o.created_at).getTime()
            return t >= from.getTime() && t <= to.getTime()
        })
    }, [orders, from, to])

    const paid = filtered.filter((o) => o.status === 'PAID')
    const open = filtered.filter(
        (o) => o.status === 'OPEN' || o.status === 'SENT_TO_KITCHEN'
    )
    const cancelled = filtered.filter((o) => o.status === 'CANCELLED')
    const sales = paid.reduce((s, o) => s + Number(o.total || 0), 0)
    const avgTicket = paid.length ? sales / paid.length : 0
    const takeaway = filtered.filter((o) => o.order_type === 'TAKEAWAY').length
    const dineIn = filtered.filter((o) => o.order_type === 'DINE_IN').length

    const rangeLabel = `${from.toLocaleDateString('fr-FR')} → ${to.toLocaleDateString('fr-FR')}`

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        {restaurantName} · <span className="text-foreground">{rangeLabel}</span>
                    </p>
                </div>
                <Button size="lg" className="shadow-sm">
                    <Link href="/pos">
                        Ouvrir le POS
                    </Link>
                </Button>
            </div>

            {/* Filtres période */}
            <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    {PERIODS.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setPeriod(p.id)}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                                period === p.id
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-muted-foreground hover:bg-muted border-border'
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {period === 'custom' && (
                    <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs">Du</Label>
                            <Input
                                type="date"
                                value={customFrom}
                                onChange={(e) => setCustomFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs">Au</Label>
                            <Input
                                type="date"
                                value={customTo}
                                onChange={(e) => setCustomTo(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats principales */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Chiffre d’affaires
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(sales, currency)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Commandes payées uniquement
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Commandes
                        </CardTitle>
                        <ShoppingBag className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filtered.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Sur la période
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ticket moyen
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(avgTicket, currency)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Sur {paid.length} payée{paid.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Ouvertes
                        </CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{open.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            En attente de paiement
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Détails */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Payées
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{paid.length}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-destructive" />
                            Annulées
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{cancelled.length}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Sur place
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{dineIn}</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            À emporter
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{takeaway}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button variant="outline" >
                    <Link href="/dashboard/orders">Voir l’historique complet</Link>
                </Button>
            </div>
        </div>
    )
}

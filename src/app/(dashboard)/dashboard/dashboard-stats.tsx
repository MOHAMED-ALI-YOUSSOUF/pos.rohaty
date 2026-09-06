'use client'

import { useEffect, useMemo, useState } from 'react'
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
    WalletCards,
    TrendingDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/formatters'
import { createClient } from '@/lib/supabase/client'
import {
    ORDER_STATUS,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    CASH_MOVEMENT_TYPE,
} from '@/lib/constants'
import type { PaymentMethod } from '@/lib/constants'
import type { DashboardCashOut, DashboardPayment } from '@/types'

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
    restaurantId,
    restaurantName,
    currency,
    enabledPaymentMethods,
    orders,
}: {
    restaurantId: string
    restaurantName: string
    currency: string
    enabledPaymentMethods: PaymentMethod[]
    orders: Order[]
}) {
    const [period, setPeriod] = useState<Period>('today')
    const [customFrom, setCustomFrom] = useState('')
    const [customTo, setCustomTo] = useState('')
    const [payments, setPayments] = useState<DashboardPayment[] | null>(null)
    const [paymentsError, setPaymentsError] = useState<string | null>(null)
    const [cashOuts, setCashOuts] = useState<DashboardCashOut[] | null>(null)
    const [cashOutsError, setCashOutsError] = useState<string | null>(null)

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

    const fromIso = from.toISOString()
    const toIso = to.toISOString()

    useEffect(() => {
        let active = true

        async function loadFinancialData() {
            const supabase = createClient()
            const [paymentsResult, cashOutsResult] = await Promise.all([
                supabase
                    .from('payments')
                    .select('id, method, amount, created_at, orders!inner(status)')
                    .eq('restaurant_id', restaurantId)
                    .eq('status', PAYMENT_STATUS.PAID)
                    .eq('orders.status', ORDER_STATUS.PAID)
                    .gte('created_at', fromIso)
                    .lte('created_at', toIso),
                supabase
                    .from('cash_movements')
                    .select('id, amount, created_at')
                    .eq('restaurant_id', restaurantId)
                    .eq('type', CASH_MOVEMENT_TYPE.OUT)
                    .gte('created_at', fromIso)
                    .lte('created_at', toIso),
            ])

            if (!active) return

            if (paymentsResult.error) {
                setPayments([])
                setPaymentsError(paymentsResult.error.message)
            } else {
                const uniquePayments = new Map<string, DashboardPayment>()
                for (const payment of paymentsResult.data || []) {
                    uniquePayments.set(payment.id, {
                        id: payment.id,
                        method: payment.method,
                        amount: Number(payment.amount || 0),
                        created_at: payment.created_at,
                    })
                }
                setPayments([...uniquePayments.values()])
                setPaymentsError(null)
            }

            if (cashOutsResult.error) {
                setCashOuts([])
                setCashOutsError(cashOutsResult.error.message)
            } else {
                const uniqueCashOuts = new Map<string, DashboardCashOut>()
                for (const cashOut of cashOutsResult.data || []) {
                    uniqueCashOuts.set(cashOut.id, {
                        id: cashOut.id,
                        amount: Number(cashOut.amount || 0),
                        created_at: cashOut.created_at,
                    })
                }
                setCashOuts([...uniqueCashOuts.values()])
                setCashOutsError(null)
            }
        }

        void loadFinancialData()
        return () => {
            active = false
        }
    }, [restaurantId, fromIso, toIso])

    const paid = filtered.filter((o) => o.status === ORDER_STATUS.PAID)
    const open = filtered.filter(
        (o) => o.status === ORDER_STATUS.OPEN || o.status === ORDER_STATUS.SENT_TO_KITCHEN
    )
    const cancelled = filtered.filter((o) => o.status === ORDER_STATUS.CANCELLED)
    const sales = paid.reduce((s, o) => s + Number(o.total || 0), 0)
    const cashOutTotal = (cashOuts || []).reduce((sum, cashOut) => sum + cashOut.amount, 0)
    const netAfterCashOuts = sales - cashOutTotal
    const takeaway = filtered.filter((o) => o.order_type === 'TAKEAWAY').length
    const dineIn = filtered.filter((o) => o.order_type === 'DINE_IN').length

    const paymentsByMethod = useMemo(() => {
        const totals = new Map<string, number>()
        for (const payment of payments || []) {
            totals.set(payment.method, (totals.get(payment.method) || 0) + payment.amount)
        }
        return totals
    }, [payments])

    const enabledMethods = PAYMENT_METHODS.filter(({ id }) => enabledPaymentMethods.includes(id))

    const changePeriod = (nextPeriod: Period) => {
        setPayments(null)
        setPaymentsError(null)
        setCashOuts(null)
        setCashOutsError(null)
        setPeriod(nextPeriod)
    }

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
                            onClick={() => changePeriod(p.id)}
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
                                onChange={(e) => {
                                    setPayments(null)
                                    setPaymentsError(null)
                                    setCashOuts(null)
                                    setCashOutsError(null)
                                    setCustomFrom(e.target.value)
                                }}
                            />
                        </div>
                        <div className="space-y-1 flex-1">
                            <Label className="text-xs">Au</Label>
                            <Input
                                type="date"
                                value={customTo}
                                onChange={(e) => {
                                    setPayments(null)
                                    setPaymentsError(null)
                                    setCashOuts(null)
                                    setCashOutsError(null)
                                    setCustomTo(e.target.value)
                                }}
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
                            Net après sorties
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {cashOuts === null ? (
                            <div className="space-y-2" aria-label="Chargement du net après sorties">
                                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                                <div className="h-4 w-52 max-w-full animate-pulse rounded bg-muted" />
                            </div>
                        ) : (
                            <>
                                <div
                                    className={cn(
                                        'text-2xl font-bold',
                                        netAfterCashOuts < 0 && 'text-destructive'
                                    )}
                                >
                                    {cashOutsError ? '—' : formatPrice(netAfterCashOuts, currency)}
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Chiffre d’affaires moins sorties de caisse
                                </p>
                                {cashOutsError && (
                                    <p className="mt-2 text-xs text-destructive" role="alert">
                                        Sorties indisponibles : {cashOutsError}
                                    </p>
                                )}
                            </>
                        )}
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

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <WalletCards className="h-5 w-5 text-primary" />
                        Encaissé par mode de paiement
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {payments === null ? (
                        <div className="space-y-3" aria-label="Chargement des encaissements">
                            <div className="h-9 w-40 animate-pulse rounded bg-muted" />
                            <div className="h-20 animate-pulse rounded-lg bg-muted" />
                        </div>
                    ) : (
                        paymentsError ? (
                            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                                Impossible de charger les encaissements : {paymentsError}
                            </p>
                        ) : (
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {enabledMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-3 py-2.5"
                                    >
                                        <span className="text-sm text-muted-foreground">{method.label}</span>
                                        <span className="whitespace-nowrap text-sm font-semibold">
                                            {formatPrice(paymentsByMethod.get(method.id) || 0, currency)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </CardContent>
            </Card>

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

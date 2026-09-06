'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Banknote } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/formatters'
import { PeriodFilter } from '@/components/dashboard/period-filter'
import type { HistoryPeriod } from '@/lib/date-range'

type Movement = {
    id: string
    type: 'CASH_OUT' | 'CASH_IN'
    amount: number
    reason: string
    note: string | null
    created_at: string
}

export function CashClient({
    restaurantId,
    profileId,
    currency,
    initialMovements,
    cashIn,
    cashOut,
    period,
    from,
    to,
    includesToday,
}: {
    restaurantId: string
    profileId: string
    currency: string
    initialMovements: Movement[]
    cashIn: number
    cashOut: number
    period: HistoryPeriod
    from: string
    to: string
    includesToday: boolean
}) {
    const [movements, setMovements] = useState(initialMovements)
    const [outTotal, setOutTotal] = useState(cashOut)
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const [amount, setAmount] = useState('')
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')

    const expectedCash = useMemo(
        () => cashIn - outTotal,
        [cashIn, outTotal]
    )

    const reset = () => {
        setAmount('')
        setReason('')
        setNote('')
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const value = parseFloat(amount)
        if (!value || value <= 0) {
            toast.error('Montant invalide')
            return
        }
        if (!reason.trim()) {
            toast.error('Motif obligatoire')
            return
        }

        setLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('cash_movements')
            .insert({
                restaurant_id: restaurantId,
                type: 'CASH_OUT',
                amount: value,
                reason: reason.trim(),
                note: note.trim() || null,
                created_by: profileId,
            })
            .select()
            .single()

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        if (includesToday) {
            setMovements((prev) => [data, ...prev])
            setOutTotal((prev) => prev + value)
        }
        toast.success('Sortie de caisse enregistrée')
        setOpen(false)
        reset()
        setLoading(false)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        const row = movements.find((m) => m.id === deleteId)
        const supabase = createClient()
        const { error } = await supabase
            .from('cash_movements')
            .delete()
            .eq('id', deleteId)

        if (error) {
            toast.error(error.message)
            return
        }

        setMovements((prev) => prev.filter((m) => m.id !== deleteId))
        if (row?.type === 'CASH_OUT') {
            setOutTotal((prev) => prev - Number(row.amount))
        }
        toast.success('Supprimée')
        setDeleteId(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Caisse</h1>
                    <p className="text-muted-foreground mt-1">
                        Sorties d’espèces et solde théorique par période
                    </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                <PeriodFilter period={period} from={from} to={to} />
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Sortie de caisse
                </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            Espèces encaissées
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-emerald-600">
                        {formatPrice(cashIn, currency)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">
                            Sorties de caisse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-destructive">
                        − {formatPrice(outTotal, currency)}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Espèces théoriques
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-2xl font-bold text-primary">
                        {formatPrice(expectedCash, currency)}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Sorties de caisse</CardTitle>
                </CardHeader>
                <CardContent>
                    {movements.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aucune sortie enregistrée
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Heure</TableHead>
                                    <TableHead>Motif</TableHead>
                                    <TableHead className="text-right">Montant</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {movements.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(m.created_at).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(m.created_at).toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{m.reason}</div>
                                            {m.note && (
                                                <div className="text-xs text-muted-foreground">
                                                    {m.note}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-destructive">
                                            − {formatPrice(Number(m.amount), currency)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => setDeleteId(m.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouvelle sortie de caisse</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Montant ({currency}) *</Label>
                            <Input
                                type="number"
                                min="1"
                                step="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Motif *</Label>
                            <Input
                                placeholder="Ex: Achat pain, gaz, courses…"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Note (optionnel)</Label>
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette sortie ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Le solde théorique sera recalculé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Retour</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

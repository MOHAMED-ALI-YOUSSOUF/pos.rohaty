'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { getPrinters, printTest } from '@/lib/printing/qz'

export function PrinterSettings({ restaurantId, initialKitchenPrinter, initialReceiptPrinter, canEdit }: { restaurantId: string; initialKitchenPrinter: string | null; initialReceiptPrinter: string | null; canEdit: boolean }) {
    const [printers, setPrinters] = useState<string[]>([])
    const [kitchenPrinter, setKitchenPrinter] = useState(initialKitchenPrinter || '')
    const [receiptPrinter, setReceiptPrinter] = useState(initialReceiptPrinter || '')
    const [status, setStatus] = useState<'idle' | 'connected' | 'unavailable'>('idle')
    const [loading, setLoading] = useState(false)

    const detect = async () => {
        setLoading(true)
        try {
            const found = await getPrinters()
            setPrinters(found)
            setStatus('connected')
            if (found.length === 1) {
                setKitchenPrinter(current => current || found[0])
                setReceiptPrinter(current => current || found[0])
            }
            toast.success(`${found.length} imprimante${found.length !== 1 ? 's' : ''} détectée${found.length !== 1 ? 's' : ''}`)
        } catch (error: unknown) {
            setStatus('unavailable')
            toast.error(error instanceof Error ? error.message : 'QZ Tray non disponible')
        } finally { setLoading(false) }
    }

    const save = async () => {
        setLoading(true)
        const { error } = await createClient().from('restaurants').update({ kitchen_printer_name: kitchenPrinter || null, receipt_printer_name: receiptPrinter || null }).eq('id', restaurantId)
        setLoading(false)
        if (error) return toast.error(error.message)
        toast.success('Imprimantes enregistrées')
    }

    const test = async (printer: string, label: string) => {
        if (!printer) return toast.error(`Imprimante ${label} non sélectionnée`)
        try { await printTest(printer); toast.success(`Test ${label} envoyé`) }
        catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Test impression impossible') }
    }

    const options = Array.from(new Set([initialKitchenPrinter, initialReceiptPrinter, ...printers].filter((value): value is string => !!value)))

    return <Card>
        <CardHeader><CardTitle className="text-base">Impression</CardTitle><CardDescription>QZ Tray et imprimantes thermiques locales</CardDescription></CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" onClick={detect} disabled={loading}>{loading ? 'Détection…' : 'Détecter les imprimantes'}</Button><span className="text-sm text-muted-foreground">{status === 'connected' ? 'QZ Tray connecté' : status === 'unavailable' ? 'QZ Tray non disponible' : 'QZ Tray non vérifié'}</span></div>
            <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Imprimante cuisine</Label><Select value={kitchenPrinter} onValueChange={value => setKitchenPrinter(value || '')} disabled={!canEdit || options.length === 0}><SelectTrigger><SelectValue placeholder="Détecter les imprimantes" /></SelectTrigger><SelectContent>{options.map(printer => <SelectItem key={printer} value={printer}>{printer}</SelectItem>)}</SelectContent></Select><Button type="button" size="sm" variant="outline" onClick={() => test(kitchenPrinter, 'cuisine')} disabled={!kitchenPrinter}>Tester cuisine</Button></div>
                <div className="space-y-2"><Label>Imprimante reçu client</Label><Select value={receiptPrinter} onValueChange={value => setReceiptPrinter(value || '')} disabled={!canEdit || options.length === 0}><SelectTrigger><SelectValue placeholder="Détecter les imprimantes" /></SelectTrigger><SelectContent>{options.map(printer => <SelectItem key={printer} value={printer}>{printer}</SelectItem>)}</SelectContent></Select><Button type="button" size="sm" variant="outline" onClick={() => test(receiptPrinter, 'reçu')} disabled={!receiptPrinter}>Tester reçu</Button></div>
            </div>
            {canEdit && <Button type="button" onClick={save} disabled={loading}>Enregistrer les imprimantes</Button>}
        </CardContent>
    </Card>
}

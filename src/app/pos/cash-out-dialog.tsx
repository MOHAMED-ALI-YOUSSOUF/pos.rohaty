'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/formatters'

export function CashOutDialog({
  open,
  onOpenChange,
  restaurantId,
  profileId,
  currency,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: string
  profileId: string
  currency: string
}) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setAmount('')
    setReason('')
    setNote('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
    const { error } = await supabase.from('cash_movements').insert({
      restaurant_id: restaurantId,
      type: 'CASH_OUT',
      amount: value,
      reason: reason.trim(),
      note: note.trim() || null,
      created_by: profileId,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(
      `Sortie de ${formatPrice(value, currency)} enregistrée`
    )
    reset()
    setLoading(false)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sortie de caisse</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Montant ({currency}) *</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 text-lg"
              placeholder="Ex: 2000"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Motif *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Achat pain, gaz, courses…"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Note (optionnel)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Détail…"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Retirer de la caisse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

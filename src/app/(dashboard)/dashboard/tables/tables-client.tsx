'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Table2 } from 'lucide-react'
import { toast } from 'sonner'

type RestaurantTable = {
    id: string
    name: string
    is_active: boolean
    restaurant_id: string
}

interface Props {
    initialTables: RestaurantTable[]
    restaurantId: string
}

export function TablesClient({ initialTables, restaurantId }: Props) {
    const [tables, setTables] = useState(initialTables)
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<RestaurantTable | null>(null)
    const [loading, setLoading] = useState(false)

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    const [name, setName] = useState('')
    const [isActive, setIsActive] = useState(true)

    const [bulkOpen, setBulkOpen] = useState(false)
    const [bulkCount, setBulkCount] = useState('8')

    const resetForm = () => {
        setName('')
        setIsActive(true)
        setEditing(null)
    }

    const openCreate = () => {
        resetForm()
        // Suggestion automatique : Table N
        const nextNumber = tables.length + 1
        setName(`Table ${nextNumber}`)
        setOpen(true)
    }

    const openEdit = (table: RestaurantTable) => {
        setEditing(table)
        setName(table.name)
        setIsActive(table.is_active)
        setOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Le nom est obligatoire')
            return
        }

        setLoading(true)
        const supabase = createClient()

        if (editing) {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .update({
                    name: name.trim(),
                    is_active: isActive,
                })
                .eq('id', editing.id)
                .select()
                .single()

            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }

            setTables((prev) =>
                prev
                    .map((t) => (t.id === editing.id ? data : t))
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
            )
            toast.success('Table mise à jour')
        } else {
            const { data, error } = await supabase
                .from('restaurant_tables')
                .insert({
                    restaurant_id: restaurantId,
                    name: name.trim(),
                    is_active: isActive,
                })
                .select()
                .single()

            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }

            setTables((prev) =>
                [...prev, data].sort((a, b) =>
                    a.name.localeCompare(b.name, undefined, { numeric: true })
                )
            )
            toast.success('Table créée')
        }

        setLoading(false)
        setOpen(false)
        resetForm()
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setDeleting(true)

        const supabase = createClient()
        const { error } = await supabase
            .from('restaurant_tables')
            .delete()
            .eq('id', deleteId)

        if (error) {
            toast.error(error.message)
            setDeleting(false)
            return
        }

        setTables((prev) => prev.filter((t) => t.id !== deleteId))
        toast.success('Table supprimée')
        setDeleteId(null)
        setDeleting(false)
    }

    const toggleActive = async (table: RestaurantTable) => {
        const supabase = createClient()
        const newValue = !table.is_active

        setTables((prev) =>
            prev.map((t) =>
                t.id === table.id ? { ...t, is_active: newValue } : t
            )
        )

        const { error } = await supabase
            .from('restaurant_tables')
            .update({ is_active: newValue })
            .eq('id', table.id)

        if (error) {
            setTables((prev) =>
                prev.map((t) =>
                    t.id === table.id ? { ...t, is_active: table.is_active } : t
                )
            )
            toast.error(error.message)
        }
    }

    // Création rapide de plusieurs tables
    const createMultiple = async () => {
        const n = parseInt(bulkCount, 10)
        if (isNaN(n) || n < 1 || n > 50) {
            toast.error('Nombre invalide (entre 1 et 50)')
            return
        }

        setLoading(true)
        const supabase = createClient()

        const start = tables.length + 1
        const rows = Array.from({ length: n }, (_, i) => ({
            restaurant_id: restaurantId,
            name: `Table ${start + i}`,
            is_active: true,
        }))

        const { data, error } = await supabase
            .from('restaurant_tables')
            .insert(rows)
            .select()

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        setTables((prev) =>
            [...prev, ...(data || [])].sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { numeric: true })
            )
        )
        toast.success(`${n} table${n > 1 ? 's' : ''} créée${n > 1 ? 's' : ''}`)
        setBulkOpen(false)
        setBulkCount('8')
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez les tables de votre restaurant
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkOpen(true)}>
                        Créer plusieurs tables
                    </Button>
                    <Button onClick={openCreate} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle table
                    </Button>
                </div>
            </div>

            {/* Liste */}
            {tables.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Table2 className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">Aucune table</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            Créez vos tables pour pouvoir prendre des commandes sur place.
                        </p>
                        <div className="flex gap-2 mt-6">
                            <Button variant="outline" onClick={createMultiple}>
                                Créer 8 tables
                            </Button>
                            <Button onClick={openCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Une table
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">
                            {tables.length} table{tables.length > 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead className="text-center">Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tables.map((table) => (
                                    <TableRow key={table.id}>
                                        <TableCell className="font-medium">{table.name}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={table.is_active ? 'default' : 'secondary'}>
                                                {table.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Switch
                                                    checked={table.is_active}
                                                    onCheckedChange={() => toggleActive(table)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(table)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(table.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Dialog Create / Edit */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Modifier la table' : 'Nouvelle table'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Table 1, Terrasse 2…"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive">Active</Label>
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Confirmation suppression */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cette table ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Les commandes liées conserveront
                            l’historique mais la table ne sera plus sélectionnable.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Suppression...' : 'Supprimer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog création multiple */}
            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Créer plusieurs tables</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="bulkCount">Nombre de tables</Label>
                            <Input
                                id="bulkCount"
                                type="number"
                                min="1"
                                max="50"
                                value={bulkCount}
                                onChange={(e) => setBulkCount(e.target.value)}
                                placeholder="8"
                            />
                            <p className="text-xs text-muted-foreground">
                                Les tables seront nommées automatiquement (Table 1, Table 2…).
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBulkOpen(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button onClick={createMultiple} disabled={loading}>
                            {loading ? 'Création...' : 'Créer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
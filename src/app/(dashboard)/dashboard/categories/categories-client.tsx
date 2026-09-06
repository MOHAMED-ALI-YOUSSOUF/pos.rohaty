'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { toast } from 'sonner'

type Category = {
    id: string
    name: string
    description: string | null
    sort_order: number
    is_active: boolean
    restaurant_id: string
    image_url?: string | null
}

interface Props {
    initialCategories: Category[]
    restaurantId: string
}

export function CategoriesClient({ initialCategories, restaurantId }: Props) {
    const [categories, setCategories] = useState(initialCategories)
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Category | null>(null)
    const [loading, setLoading] = useState(false)
    const [imageUrl, setImageUrl] = useState('')

    // Delete confirmation
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Form
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [sortOrder, setSortOrder] = useState(0)
    const [isActive, setIsActive] = useState(true)

    const resetForm = () => {
        setName('')
        setDescription('')
        setSortOrder(categories.length)
        setIsActive(true)
        setEditing(null)
        setImageUrl('')
    }

    const openCreate = () => {
        resetForm()
        setSortOrder(categories.length)
        setOpen(true)
        setImageUrl('')
    }

    const openEdit = (category: Category) => {
        setEditing(category)
        setName(category.name)
        setDescription(category.description || '')
        setSortOrder(category.sort_order)
        setIsActive(category.is_active)
        setImageUrl(category.image_url || '')
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
                .from('categories')
                .update({
                    name: name.trim(),
                    description: description.trim() || null,
                    sort_order: sortOrder,
                    is_active: isActive,
                    image_url: imageUrl.trim() || null,
                })
                .eq('id', editing.id)
                .select()
                .single()

            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }

            // Mise à jour immédiate de la liste
            setCategories((prev) =>
                prev
                    .map((c) => (c.id === editing.id ? data : c))
                    .sort((a, b) => a.sort_order - b.sort_order)
            )
            toast.success('Catégorie mise à jour')
        } else {
            const { data, error } = await supabase
                .from('categories')
                .insert({
                    restaurant_id: restaurantId,
                    name: name.trim(),
                    description: description.trim() || null,
                    sort_order: sortOrder,
                    is_active: isActive,
                    image_url: imageUrl.trim() || null,
                })
                .select()
                .single()

            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }

            setCategories((prev) =>
                [...prev, data].sort((a, b) => a.sort_order - b.sort_order)
            )
            toast.success('Catégorie créée')
        }

        setLoading(false)
        setOpen(false)
        resetForm()
    }

    const handleDelete = async () => {
        if (!deleteId) return

        setDeleting(true)
        const supabase = createClient()
        const { error } = await supabase.from('categories').delete().eq('id', deleteId)

        if (error) {
            toast.error(error.message)
            setDeleting(false)
            return
        }

        setCategories((prev) => prev.filter((c) => c.id !== deleteId))
        toast.success('Catégorie supprimée')
        setDeleteId(null)
        setDeleting(false)
    }

    const toggleActive = async (category: Category) => {
        const supabase = createClient()
        const newValue = !category.is_active

        // Optimistic update
        setCategories((prev) =>
            prev.map((c) =>
                c.id === category.id ? { ...c, is_active: newValue } : c
            )
        )

        const { error } = await supabase
            .from('categories')
            .update({ is_active: newValue })
            .eq('id', category.id)

        if (error) {
            // Rollback
            setCategories((prev) =>
                prev.map((c) =>
                    c.id === category.id ? { ...c, is_active: category.is_active } : c
                )
            )
            toast.error(error.message)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Catégories</h1>
                    <p className="text-muted-foreground mt-1">
                        Organisez votre menu (Entrées, Plats, Boissons…)
                    </p>
                </div>
                <Button onClick={openCreate} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle catégorie
                </Button>
            </div>

            {/* Liste */}
            {categories.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Tags className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">Aucune catégorie</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            Créez votre première catégorie pour commencer à structurer votre menu.
                        </p>
                        <Button onClick={openCreate} className="mt-6">
                            <Plus className="mr-2 h-4 w-4" />
                            Créer une catégorie
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">
                            {categories.length} catégorie{categories.length > 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-center">Ordre</TableHead>
                                    <TableHead className="text-center">Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            {category.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={category.image_url}
                                                    alt=""
                                                    className="h-10 w-10 rounded-md object-cover border"
                                                />
                                            ) : (
                                                <span className="text-muted-foreground text-xs">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">
                                            {category.description || '—'}
                                        </TableCell>
                                        <TableCell className="text-center">{category.sort_order}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                {category.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Switch
                                                    checked={category.is_active}
                                                    onCheckedChange={() => toggleActive(category)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(category)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(category.id)}
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
                            {editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Entrées, Pizzas, Boissons…"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Description optionnelle"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full min-w-0"
                                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                            />


                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sortOrder">Ordre d’affichage</Label>
                            <Input
                                id="sortOrder"
                                type="number"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Image</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                disabled={loading}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    try {
                                        setLoading(true)
                                        const { uploadRestaurantFile } = await import('@/lib/upload')
                                        const path = `categories/${editing?.id || crypto.randomUUID()}`
                                        const url = await uploadRestaurantFile(restaurantId, file, path)
                                        setImageUrl(url)
                                        toast.success('Image uploadée')
                                    } catch (err: unknown) {
                                        toast.error(err instanceof Error ? err.message : 'Erreur upload')
                                    } finally {
                                        setLoading(false)
                                    }
                                }}
                            />
                            {imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={imageUrl}
                                    alt=""
                                    className="h-16 w-16 rounded-lg object-cover border"
                                />
                            )}
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
                        <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Les produits liés à cette catégorie
                            devront être réassignés ou supprimés.
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
        </div>
    )
}

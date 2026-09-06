'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import { formatPrice } from '@/lib/formatters'
import { toast } from 'sonner'

type Category = {
    id: string
    name: string
    is_active: boolean
}

type Product = {
    id: string
    name: string
    description: string | null
    price: number
    is_available: boolean
    sort_order: number
    category_id: string
    restaurant_id: string
    image_url?: string | null
    categories?: { name: string } | null
}

interface Props {
    initialProducts: Product[]
    categories: Category[]
    restaurantId: string
}

export function ProductsClient({
    initialProducts,
    categories,
    restaurantId,
}: Props) {
    const [products, setProducts] = useState(initialProducts)
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Product | null>(null)
    const [loading, setLoading] = useState(false)

    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Form
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [sortOrder, setSortOrder] = useState(0)
    const [isAvailable, setIsAvailable] = useState(true)
    const [imageUrl, setImageUrl] = useState('')

    const resetForm = () => {
        setName('')
        setDescription('')
        setPrice('')
        setCategoryId(categories[0]?.id || '')
        setSortOrder(products.length)
        setIsAvailable(true)
        setImageUrl('')
        setEditing(null)
    }

    const openCreate = () => {
        if (categories.length === 0) {
            toast.error('Créez d’abord une catégorie')
            return
        }
        resetForm()
        setCategoryId(categories[0].id)
        setSortOrder(products.length)
        setOpen(true)
        setImageUrl('') // create
    }

    const openEdit = (product: Product) => {
        setEditing(product)
        setImageUrl(product.image_url || '') // edit
        setName(product.name)
        setDescription(product.description || '')
        setPrice(String(product.price))
        setCategoryId(product.category_id)
        setSortOrder(product.sort_order)
        setIsAvailable(product.is_available)
        setOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Le nom est obligatoire')
            return
        }
        if (!categoryId) {
            toast.error('Choisissez une catégorie')
            return
        }
        const priceNum = parseFloat(price)
        if (isNaN(priceNum) || priceNum < 0) {
            toast.error('Prix invalide')
            return
        }

        setLoading(true)
        const supabase = createClient()

        const payload = {
            name: name.trim(),
            description: description.trim() || null,
            price: priceNum,
            category_id: categoryId,
            sort_order: sortOrder,
            is_available: isAvailable,
            image_url: imageUrl.trim() || null,
        }

        if (editing) {
            const { data, error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', editing.id)
                .select('*, categories(name)')
                .single()

            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }

            setProducts((prev) =>
                prev
                    .map((p) => (p.id === editing.id ? data : p))
                    .sort((a, b) => a.sort_order - b.sort_order)
            )
            toast.success('Produit mis à jour')
        } else {
            const { data, error } = await supabase
                .from('products')
                .insert({
                    ...payload,
                    restaurant_id: restaurantId,
                })
                .select('*, categories(name)')
                .single()

            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }

            setProducts((prev) =>
                [...prev, data].sort((a, b) => a.sort_order - b.sort_order)
            )
            toast.success('Produit créé')
        }

        setLoading(false)
        setOpen(false)
        resetForm()
    }

    const handleDelete = async () => {
        if (!deleteId) return
        setDeleting(true)

        const supabase = createClient()
        const { error } = await supabase.from('products').delete().eq('id', deleteId)

        if (error) {
            toast.error(error.message)
            setDeleting(false)
            return
        }

        setProducts((prev) => prev.filter((p) => p.id !== deleteId))
        toast.success('Produit supprimé')
        setDeleteId(null)
        setDeleting(false)
    }

    const toggleAvailable = async (product: Product) => {
        const supabase = createClient()
        const newValue = !product.is_available

        setProducts((prev) =>
            prev.map((p) =>
                p.id === product.id ? { ...p, is_available: newValue } : p
            )
        )

        const { error } = await supabase
            .from('products')
            .update({ is_available: newValue })
            .eq('id', product.id)

        if (error) {
            setProducts((prev) =>
                prev.map((p) =>
                    p.id === product.id ? { ...p, is_available: product.is_available } : p
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
                    <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez les plats, boissons et prix de votre menu
                    </p>
                </div>
                <Button onClick={openCreate} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau produit
                </Button>
            </div>

            {/* Liste */}
            {products.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Package className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">Aucun produit</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            Ajoutez votre premier produit pour commencer à construire le menu.
                        </p>
                        <Button onClick={openCreate} className="mt-6">
                            <Plus className="mr-2 h-4 w-4" />
                            Créer un produit
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium">
                            {products.length} produit{products.length > 1 ? 's' : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Catégorie</TableHead>
                                    <TableHead className="text-right">Prix</TableHead>
                                    <TableHead className="text-center">Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {product.image_url && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={product.image_url}
                                                        alt=""
                                                        className="h-10 w-10 rounded-lg object-cover border"
                                                    />
                                                )}
                                                <div className="font-medium">{product.name}</div>
                                                {product.description && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {product.description}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {product.categories?.name || '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatPrice(Number(product.price))}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={product.is_available ? 'default' : 'secondary'}>
                                                {product.is_available ? 'Disponible' : 'Indisponible'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Switch
                                                    checked={product.is_available}
                                                    onCheckedChange={() => toggleAvailable(product)}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEdit(product)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteId(product.id)}
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Modifier le produit' : 'Nouveau produit'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Pizza Margherita"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Ingrédients, détails…"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={2}
                                className='break-words'
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Prix (FDJ) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="2500"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">Ordre</Label>
                                <Input
                                    id="sortOrder"
                                    type="number"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Catégorie *</Label>
                            <Select
                                value={categoryId}
                                onValueChange={(value) => setCategoryId(value ?? '')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une catégorie">
                                        {categories.find((c) => c.id === categoryId)?.name || 'Choisir une catégorie'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                            {!cat.is_active ? ' (inactive)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Photo</Label>
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
                                        const path = `products/${editing?.id || crypto.randomUUID()}`
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
                                    className="h-20 w-20 rounded-lg object-cover border"
                                />
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isAvailable">Disponible</Label>
                            <Switch
                                id="isAvailable"
                                checked={isAvailable}
                                onCheckedChange={setIsAvailable}
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
                        <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le produit disparaîtra du menu et du POS.
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

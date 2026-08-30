'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useOrderStore } from '@/stores/order-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Minus,
    Plus,
    Trash2,
    Send,
    ArrowLeft,
    ShoppingBag,
    UtensilsCrossed,
    LayoutGrid,
    Receipt,
    Utensils,
    CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PosOrdersPanel } from './pos-orders-panel'
import { CashOutDialog } from './cash-out-dialog'
import { Banknote } from 'lucide-react'
import Image from 'next/image'
import { Input } from '@base-ui/react'
import { Label } from '@/components/ui/label'


type Category = { id: string; name: string }
type Product = {
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
    category_id: string
}
type Table = { id: string; name: string }

interface Props {
    categories: Category[]
    products: Product[]
    tables: Table[]
    profile: {
        id: string
        fullName: string
        restaurantId: string
        restaurantName: string
        currency: string
    }
}

export function PosClient({ categories, products, tables, profile }: Props) {
    const router = useRouter()
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
    const [tableDialogOpen, setTableDialogOpen] = useState(false)
    const [sending, setSending] = useState(false)
    const [mobileTab, setMobileTab] = useState<'products' | 'order'>('products')
    type RightPanel = 'cart' | 'orders' | 'pay'
    const [panel, setPanel] = useState<RightPanel>('cart')
    const [payingOrderId, setPayingOrderId] = useState<string | null>(null)
    const {
        orderType,
        tableId,
        tableName,
        items,
        note,
        setOrderType,
        setTable,
        addItem,
        updateQuantity,
        removeItem,
        setNote,
        clearOrder,
        getTotal,
    } = useOrderStore()
    const [cashOutOpen, setCashOutOpen] = useState(false)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<
        'CASH' | 'DMONEY' | 'WAAFI' | 'CARD' | 'OTHER'
    >('CASH')
    const [receivedAmount, setReceivedAmount] = useState('')
    const [paying, setPaying] = useState(false)


    const filteredProducts =
        selectedCategory === 'all'
            ? products
            : products.filter((p) => p.category_id === selectedCategory)

    const formatPrice = (value: number) =>
        new Intl.NumberFormat('fr-FR').format(value) + ' ' + profile.currency

    const handleSelectTable = (table: Table) => {
        setTable(table.id, table.name)
        setTableDialogOpen(false)
    }

    const handleTakeaway = () => {
        setOrderType('TAKEAWAY')
        // setTable(null, null)
        setTableDialogOpen(false)
    }

    const PAYMENT_METHODS = [
        { id: 'CASH', label: 'Espèces' },
        { id: 'DMONEY', label: 'D-Money' },
        { id: 'WAAFI', label: 'Waafi' },
        { id: 'CARD', label: 'Carte' },
        { id: 'OTHER', label: 'Autre' },
    ] as const

    const currentTotal = getTotal()

    const receivedNum = parseFloat(receivedAmount) || 0

    const change =
        paymentMethod === 'CASH'
            ? Math.max(0, receivedNum - currentTotal)
            : 0

    const canPay =
        currentTotal > 0 &&
        (paymentMethod !== 'CASH' || receivedNum >= currentTotal)


    const handlePayment = async () => {
        if (items.length === 0) {
            toast.error('Ajoutez au moins un produit')
            return
        }

        if (orderType === 'DINE_IN' && !tableId) {
            toast.error('Sélectionnez une table')
            setPaymentDialogOpen(false)
            setTableDialogOpen(true)
            return
        }

        if (!canPay) {
            toast.error('Montant reçu insuffisant')
            return
        }

        setPaying(true)

        const supabase = createClient()
        const total = getTotal()

        // 1. Créer la commande directement comme PAID
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                restaurant_id: profile.restaurantId,
                table_id: tableId,
                order_type: orderType,
                status: 'PAID',
                subtotal: total,
                discount: 0,
                total,
                note: note || null,
                created_by: profile.id,
            })
            .select()
            .single()

        if (orderError || !order) {
            toast.error(orderError?.message || 'Erreur création commande')
            setPaying(false)
            return
        }

        // 2. Créer les lignes de commande
        const orderItems = items.map((item) => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.unitPrice * item.quantity,
            note: item.note || null,
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) {
            toast.error(itemsError.message)
            setPaying(false)
            return
        }

        // 3. Enregistrer le paiement
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                restaurant_id: profile.restaurantId,
                order_id: order.id,
                amount: total,
                method: paymentMethod,
                status: 'PAID',
                received_amount:
                    paymentMethod === 'CASH' ? receivedNum : total,
                change_amount:
                    paymentMethod === 'CASH' ? change : 0,
                created_by: profile.id,
            })

        if (paymentError) {
            toast.error(paymentError.message)
            setPaying(false)
            return
        }

        toast.success(`Commande #${order.order_number} encaissée`)

        // 4. Imprimer le ticket client
        window.open(
            `/print/receipt/${order.id}`,
            '_blank',
            'noopener,width=420,height=720'
        )

        // 5. Nettoyer
        clearOrder()
        setPaymentDialogOpen(false)
        setReceivedAmount('')
        setPaymentMethod('CASH')
        setPaying(false)

        setMobileTab('order')
        setPanel('orders')
    }

    const handleSendToKitchen = async () => {
        if (items.length === 0) {
            toast.error('Ajoutez au moins un produit')
            return
        }
        if (orderType === 'DINE_IN' && !tableId) {
            toast.error('Sélectionnez une table')
            setTableDialogOpen(true)
            return
        }

        setSending(true)
        const supabase = createClient()
        const total = getTotal()

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                restaurant_id: profile.restaurantId,
                table_id: tableId,
                order_type: orderType,
                status: 'SENT_TO_KITCHEN',
                subtotal: total,
                discount: 0,
                total,
                note: note || null,
                created_by: profile.id,
            })
            .select()
            .single()

        if (orderError || !order) {
            toast.error(orderError?.message || 'Erreur création commande')
            setSending(false)
            return
        }

        const orderItems = items.map((item) => ({
            order_id: order.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.unitPrice * item.quantity,
            note: item.note || null,
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) {
            toast.error(itemsError.message)
            setSending(false)
            return
        }

        toast.success(`Commande #${order.order_number} envoyée`)
        clearOrder()
        setSending(false)
        setMobileTab('order')
        setPanel('orders')
        window.open(
            `/print/kitchen/${order.id}`,
            '_blank',
            'noopener,width=420,height=720'
        )
    }

    return (
        <div className="h-[100dvh] flex flex-col bg-muted/30">
            {/* Header */}
            <header className="h-14 border-b bg-background flex items-center justify-between px-3 sm:px-4 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <Link href="/dashboard">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                            <UtensilsCrossed className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm leading-none truncate">
                                {profile.restaurantName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate hidden sm:block">
                                {profile.fullName}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={panel === 'orders' || panel === 'pay' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                            setPanel('orders')
                            setPayingOrderId(null)
                            setMobileTab('order')
                        }}
                    >
                        Commandes
                    </Button>
                    <Button
                        variant={panel === 'cart' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPanel('cart')}
                    >
                        Nouvelle
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCashOutOpen(true)}
                        title="Sortie de caisse"
                    >
                        <Banknote className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Sortie</span>
                    </Button>

                    {/* Badge items mobile */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="lg:hidden relative"
                        onClick={() => setMobileTab(mobileTab === 'order' ? 'products' : 'order')}
                    >
                        <Receipt className="h-4 w-4" />
                        {items.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                {items.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                        )}
                    </Button>
                </div>
            </header>

            {/* Corps */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Catégories - cachées sur très petit, visibles tablet+ */}
                <aside className="hidden sm:flex w-36 md:w-44 border-r bg-background flex-col shrink-0">
                    <div className="p-3 border-b">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Catégories
                        </p>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={cn(
                                    'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    selectedCategory === 'all'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-muted text-muted-foreground'
                                )}
                            >
                                Tous
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                        selectedCategory === cat.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted text-muted-foreground'
                                    )}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </aside>

                {/* Produits */}
                <main
                    className={cn(
                        'flex-1 min-w-0 min-h-0 overflow-hidden flex-col bg-muted/20',
                        mobileTab === 'products' ? 'flex' : 'hidden lg:flex'
                    )}
                >
                    {/* Catégories horizontales mobile */}
                    <div className="sm:hidden border-b bg-background overflow-x-auto">
                        <div className="flex gap-1 p-2 min-w-max">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={cn(
                                    'category-pill whitespace-nowrap',
                                    selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                )}
                                data-active={selectedCategory === 'all'}
                            >
                                Tous
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={cn(
                                        'category-pill whitespace-nowrap',
                                        selectedCategory === cat.id
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    )}
                                    data-active={selectedCategory === cat.id}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ScrollArea className="flex-1 min-h-0 p-2 sm:p-3">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <ShoppingBag className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">Aucun produit</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => {
                                            addItem({
                                                productId: product.id,
                                                productName: product.name,
                                                unitPrice: Number(product.price),
                                            })
                                            // Sur mobile, feedback rapide
                                            if (window.innerWidth < 1024) {
                                                toast.success(product.name, { duration: 800 })
                                            }
                                        }}
                                        className="product-card p-3 sm:p-4 text-left active:scale-[0.97] transition-all"
                                    >
                                        <div className="w-full aspect-square overflow-hidden rounded-md mb-2">
                                            {product.image_url ? (
                                                <Image
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    width={100}
                                                    height={100}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                                    <Utensils className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-semibold text-sm leading-tight line-clamp-2">
                                            {product.name}
                                        </p>
                                        {product.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 hidden sm:block">
                                                {product.description}
                                            </p>
                                        )}
                                        <p className="text-sm font-bold text-primary mt-2">
                                            {formatPrice(Number(product.price))}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </main>

                {/* Commande */}
                <aside
                    className={cn(
                        'border-l bg-background h-full flex-col shrink-0 min-h-0',
                        'w-full lg:w-80',
                        mobileTab === 'order' ? 'flex' : 'hidden lg:flex'
                    )}
                >
                    {panel === 'orders' ? (
                        <PosOrdersPanel
                            restaurantId={profile.restaurantId}
                            profileId={profile.id}
                            currency={profile.currency}
                            onBackToCart={() => {
                                setPanel('cart')
                                setPayingOrderId(null)
                            }}
                        />
                    ) : (
                        <>
                            {/* Header panier */}
                            <div className="p-3 border-b space-y-2 shrink-0">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Commande
                                    </p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="lg:hidden h-8"
                                        onClick={() => setMobileTab('products')}
                                    >
                                        <LayoutGrid className="h-4 w-4 mr-1" />
                                        Produits
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => setTableDialogOpen(true)}
                                >
                                    {orderType === 'TAKEAWAY'
                                        ? '🛒 À emporter'
                                        : tableName
                                            ? `🪑 ${tableName}`
                                            : 'Sélectionner table…'}
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 min-h-0">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4">
                                        <p className="text-sm text-center">
                                            Cliquez sur un produit pour l’ajouter
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-3 space-y-3">
                                        {items.map((item) => (
                                            <div
                                                key={item.productId}
                                                className="rounded-lg border p-3 space-y-2"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-medium text-sm leading-tight break-words min-w-0">
                                                        {item.productName}
                                                    </p>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0 text-destructive"
                                                        onClick={() => removeItem(item.productId)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-9 w-9"
                                                            onClick={() =>
                                                                updateQuantity(item.productId, item.quantity - 1)
                                                            }
                                                        >
                                                            <Minus className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <span className="w-8 text-center font-semibold text-sm">
                                                            {item.quantity}
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-9 w-9"
                                                            onClick={() =>
                                                                updateQuantity(item.productId, item.quantity + 1)
                                                            }
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                    <p className="text-sm font-semibold">
                                                        {formatPrice(item.unitPrice * item.quantity)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <Textarea
                                            placeholder="Note (sans oignons…)"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="border-t p-4 space-y-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium">Total</span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatPrice(getTotal())}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        className="h-12 text-sm font-semibold"
                                        disabled={items.length === 0 || sending || paying}
                                        onClick={handleSendToKitchen}
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        {sending ? 'Envoi...' : 'Cuisine'}
                                    </Button>

                                    <Button
                                        variant="default"
                                        className="h-12 text-sm font-semibold"
                                        disabled={items.length === 0 || sending || paying}
                                        onClick={() => {
                                            setPaymentMethod('CASH')
                                            setReceivedAmount('')
                                            setPaymentDialogOpen(true)
                                        }}
                                    >
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Encaisser
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </aside>
            </div>

            {/* Dialog table */}
            <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Type de commande</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <Button
                            variant="outline"
                            className="w-full h-12 justify-start text-base"
                            onClick={handleTakeaway}
                        >
                            🛒 À emporter
                        </Button>
                        <div>
                            <p className="text-sm font-medium mb-2 text-muted-foreground">Tables</p>
                            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                                {tables.map((table) => (
                                    <Button
                                        key={table.id}
                                        variant={tableId === table.id ? 'default' : 'outline'}
                                        className="h-12"
                                        onClick={() => handleSelectTable(table)}
                                    >
                                        {table.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTableDialogOpen(false)}>
                            Fermer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Encaissement</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">

                        {/* Total */}
                        <div className="rounded-lg bg-muted p-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                Total à payer
                            </p>

                            <p className="text-2xl font-bold text-primary">
                                {formatPrice(currentTotal)}
                            </p>
                        </div>

                        {/* Mode de paiement */}
                        <div>
                            <Label className="mb-2 block">
                                Mode de paiement
                            </Label>

                            <div className="grid grid-cols-2 gap-2">
                                {PAYMENT_METHODS.map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethod(method.id)
                                            if (method.id !== 'CASH') {
                                                setReceivedAmount(
                                                    String(currentTotal)
                                                )
                                            } else {
                                                setReceivedAmount('')
                                            }
                                        }}
                                        className={cn(
                                            'h-11 rounded-lg border text-sm font-medium transition-colors',
                                            paymentMethod === method.id
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'hover:bg-muted'
                                        )}
                                    >
                                        {method.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Espèces */}
                        {paymentMethod === 'CASH' && (
                            <div className="space-y-2">
                                <Label>Montant reçu</Label>

                                <Input
                                    type="number"
                                    min={currentTotal}
                                    value={receivedAmount}
                                    onChange={(e) =>
                                        setReceivedAmount(e.target.value)
                                    }
                                    placeholder={String(currentTotal)}
                                    className="h-12 text-lg"
                                />

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Rendu
                                    </span>

                                    <span className="font-bold">
                                        {formatPrice(change)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Résumé */}
                        <div className="border-t pt-3 flex justify-between">
                            <span className="font-medium">
                                Total
                            </span>

                            <span className="font-bold text-primary">
                                {formatPrice(currentTotal)}
                            </span>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPaymentDialogOpen(false)}
                            disabled={paying}
                        >
                            Annuler
                        </Button>

                        <Button
                            className="flex-1"
                            disabled={!canPay || paying}
                            onClick={handlePayment}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />

                            {paying
                                ? 'Encaissement...'
                                : 'Confirmer l’encaissement'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <CashOutDialog
                open={cashOutOpen}
                onOpenChange={setCashOutOpen}
                restaurantId={profile.restaurantId}
                profileId={profile.id}
                currency={profile.currency}
            />
        </div>
    )
}
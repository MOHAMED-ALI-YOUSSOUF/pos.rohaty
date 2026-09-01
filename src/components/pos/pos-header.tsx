'use client'

import { Banknote, Receipt, UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/types'

export function PosHeader({ restaurantName, fullName, panel, items, onShowOrders, onShowCart, onOpenCashOut, onToggleMobileTab }: {
    restaurantName: string; fullName: string; panel: 'cart' | 'orders' | 'pay'; items: CartItem[]
    onShowOrders: () => void; onShowCart: () => void; onOpenCashOut: () => void; onToggleMobileTab: () => void
}) {
    // const leavePos = () => {
    //     if (items.length > 0 && !window.confirm('Le panier en cours sera conservé. Quitter le POS ?')) return
    //     router.push('/dashboard')
    // }
    return <header className="h-14 border-b bg-background flex items-center justify-between px-3 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* <Button variant="ghost" size="icon" className="shrink-0" onClick={leavePos} aria-label="Retour au dashboard"><ArrowLeft className="h-5 w-5" /></Button> */}
            <div className="flex items-center gap-2 min-w-0"><div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0"><UtensilsCrossed className="h-4 w-4" /></div>
                <div className="min-w-0"><p className="font-semibold text-sm leading-none truncate">{restaurantName}</p><p className="text-xs text-muted-foreground truncate hidden sm:block">{fullName}</p></div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant={panel === 'orders' || panel === 'pay' ? 'default' : 'outline'} size="sm" onClick={onShowOrders}>Commandes</Button>
            <Button variant={panel === 'cart' ? 'default' : 'outline'} size="sm" onClick={onShowCart}>Nouvelle</Button>
            <Button variant="outline" size="sm" onClick={onOpenCashOut} title="Sortie de caisse"><Banknote className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Sortie</span></Button>
            <Button variant="outline" size="sm" className="lg:hidden relative" onClick={onToggleMobileTab}>
                <Receipt className="h-4 w-4" />{items.length > 0 && <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>}
            </Button>
        </div>
    </header>
}

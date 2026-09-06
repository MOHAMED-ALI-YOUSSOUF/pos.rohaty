'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Tags,
    Package,
    Table2,
    ClipboardList,
    // Users,
    Settings,
    LogOut,
    ShoppingCart,
    UtensilsCrossed,
    PanelLeft,
    X,
    Banknote,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
    restaurantName: string
    fullName: string
    signOutAction: () => Promise<void>
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/categories', label: 'Catégories', icon: Tags },
    { href: '/dashboard/products', label: 'Produits', icon: Package },
    { href: '/dashboard/tables', label: 'Tables', icon: Table2 },
    { href: '/dashboard/orders', label: 'Commandes', icon: ClipboardList },
    { href: '/dashboard/cash', label: 'Caisse', icon: Banknote },
    // { href: '/dashboard/staff', label: 'Équipe', icon: Users },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
]

export function Sidebar({ restaurantName, fullName, signOutAction }: SidebarProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed')
        // eslint-disable-next-line
        if (saved) setCollapsed(saved === 'true')
    }, [])

    function toggleCollapsed() {
        setCollapsed((prev) => {
            localStorage.setItem('sidebar-collapsed', String(!prev))
            return !prev
        })
    }

    return (
        <>
            {/* Bouton mobile */}
            <div className="fixed top-4 left-4 z-[100] lg:hidden">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 bg-background shadow-md"
                    onClick={() => setMobileOpen(true)}
                >
                    <PanelLeft className="h-5 w-5" />
                </Button>
            </div>

            {/* Overlay mobile */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-[90] bg-black/40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-[100] flex w-64 flex-col border-r bg-background shadow-xl transition-transform duration-200 ease-in-out',
                    'lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    collapsed && 'lg:w-[68px]'
                )}
            >
                {/* Header */}
                <div className={cn('flex items-center border-b h-16 shrink-0', collapsed ? 'justify-center px-2' : 'justify-between px-4')}>
                    {!collapsed ? (
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <UtensilsCrossed className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium leading-tight">{restaurantName}</p>
                                <p className="truncate text-xs text-muted-foreground">{fullName}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <UtensilsCrossed className="h-4 w-4" />
                        </div>
                    )}

                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 lg:hidden" onClick={() => setMobileOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>

                </div>

                {/* Toggle desktop */}
                <button
                    onClick={toggleCollapsed}
                    className="hidden lg:flex items-center justify-center h-8 w-8 absolute -right-3 top-14 rounded-full border bg-background shadow-sm hover:bg-muted transition-colors z-10"
                >
                    <PanelLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
                </button>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    'group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                                    collapsed ? 'justify-center h-10 w-10 mx-auto' : 'px-3 py-2',
                                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                {!collapsed && item.label}
                                {collapsed && (
                                    <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground text-background text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        )
                    })}

                    <div className={cn('pt-3', collapsed ? '' : 'px-0')}>
                        <Link
                            href="/pos"
                            title={collapsed ? 'Ouvrir le POS' : undefined}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'group relative flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90',
                                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'w-full justify-center px-3 py-2.5 text-sm'
                            )}
                        >
                            <ShoppingCart className="h-4 w-4 shrink-0" />
                            {!collapsed && 'Ouvrir le POS'}
                            {collapsed && (
                                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground text-background text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    Ouvrir le POS
                                </span>
                            )}
                        </Link>
                    </div>
                </nav>

                {/* Footer */}
                <div className="border-t p-2">
                    <form action={signOutAction}>
                        <button
                            type="submit"
                            title={collapsed ? 'Déconnexion' : undefined}
                            className={cn(
                                'group relative flex items-center gap-3 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
                                collapsed ? 'justify-center h-10 w-10 mx-auto' : 'w-full px-3 py-2.5'
                            )}
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            {!collapsed && 'Déconnexion'}
                            {collapsed && (
                                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground text-background text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    Déconnexion
                                </span>
                            )}
                        </button>
                    </form>
                </div>
            </aside>
        </>
    )
}
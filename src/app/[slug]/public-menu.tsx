'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    Search,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Phone,
    ArrowUp,
    X,
    Moon,
    Sun,
} from 'lucide-react'
import { formatPrice } from '@/lib/formatters'

type Dish = {
    id: string
    name: string
    description: string | null
    price: number
    image_url: string | null
}

type Category = {
    id: string
    name: string
    description: string | null
    image_url: string | null
    dishes: Dish[]
}

type Restaurant = {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    cover_url: string | null
    phone: string | null
    address: string | null
    currency: string
    primary_color: string
}

interface Props {
    restaurant: Restaurant
    categories: Category[]
}

/** --- Dish Card --- */
function DishCard({
    dish,
    color,
    currency,
}: {
    dish: Dish
    color: string
    currency: string
}) {
    return (
        <div className="group h-full bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_45px_rgba(15,23,42,0.14)] transition-all duration-300 border border-gray-200/80 dark:border-gray-700 hover:-translate-y-1">
            <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                {dish.image_url ? (
                    <Image
                        src={dish.image_url}
                        alt={dish.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center text-white text-4xl"
                        style={{ backgroundColor: color + '60' }}
                    >
                        🍽️
                    </div>
                )}
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg text-gray-900 dark:text-white font-bold leading-snug line-clamp-1">
                        {dish.name}
                    </h4>
                    {/* {dish.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed min-h-10">
                            {dish.description}
                        </p>
                    )} */}
                </div>
                <div
                    className="text-sm font-bold text-white rounded-xl py-2 px-3.5 shrink-0 self-start shadow-sm"
                    style={{ backgroundColor: color }}
                >
                    {formatPrice(dish.price, currency.toLowerCase())}
                </div>
            </div>
        </div>
    )
}

/** --- Category Header --- */
function CategoryHeader({
    category,
    color,
}: {
    category: Category
    color: string
}) {
    return (
        <div className="flex items-center gap-3 sm:gap-4 bg-white/90 dark:bg-gray-800/90 rounded-2xl p-3 sm:p-4 shadow-[0_6px_24px_rgba(15,23,42,0.05)] border border-gray-200/80 dark:border-gray-700">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
                {category.image_url ? (
                    <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center text-white text-xl"
                        style={{ backgroundColor: color }}
                    >
                        🍽️
                    </div>
                )}
            </div>
            <div className="flex-1 flex justify-between items-center gap-2 min-w-0">
                <h3 className="sm:text-xl text-lg font-extrabold text-gray-900 dark:text-white truncate">
                    {category.name}
                </h3>
                <span
                    className="text-xs font-semibold text-white px-3 py-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                >
                    {category.dishes.length} plat{category.dishes.length > 1 ? 's' : ''}
                </span>
            </div>
        </div>
    )
}

/** --- MAIN --- */
export function PublicMenu({ restaurant, categories }: Props) {
    const [selectedCategory, setSelectedCategory] = useState(
        categories[0]?.id || ''
    )
    const [searchTerm, setSearchTerm] = useState('')
    const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})
    const categoryScrollerRef = useRef<HTMLDivElement | null>(null)
    const isScrolling = useRef(false)
    const [selectedDish, setSelectedDish] = useState<Dish | null>(null)

    const primary = restaurant.primary_color || '#f97316'
    const secondary = '#1e3a8a'

    useEffect(() => {
        const savedTheme = window.localStorage.getItem('public-menu-theme')
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark

        document.documentElement.classList.toggle('dark', shouldUseDark)
    }, [])

    const toggleTheme = () => {
        const nextIsDark = !document.documentElement.classList.contains('dark')
        document.documentElement.classList.toggle('dark', nextIsDark)
        window.localStorage.setItem('public-menu-theme', nextIsDark ? 'dark' : 'light')
    }

    const filteredCategories = useMemo(() => {
        return categories
            .map((category) => ({
                ...category,
                dishes: category.dishes.filter(
                    (dish) =>
                        dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (dish.description || '')
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                ),
            }))
            .filter((category) => category.dishes.length > 0)
    }, [searchTerm, categories])

    const scrollToCategoryInBar = (categoryId: string) => {
        const element = categoryRefs.current[categoryId]
        const scroller = categoryScrollerRef.current
        if (element && scroller) {
            const elementLeft = element.offsetLeft
            const elementWidth = element.offsetWidth
            const scrollerWidth = scroller.offsetWidth
            scroller.scrollTo({
                left: elementLeft - scrollerWidth / 2 + elementWidth / 2,
                behavior: 'smooth',
            })
        }
    }

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId)
        const element = document.querySelector(`[data-category-id="${categoryId}"]`)
        if (element) {
            isScrolling.current = true
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            setTimeout(() => {
                isScrolling.current = false
            }, 1000)
        }
    }

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (isScrolling.current) return
                const visible = entries.find(
                    (e) => e.isIntersecting && e.intersectionRatio > 0.4
                )
                if (visible) {
                    const id = visible.target.getAttribute('data-category-id')
                    if (id) {
                        setSelectedCategory(id)
                        scrollToCategoryInBar(id)
                    }
                }
            },
            { threshold: 0.4 }
        )

        filteredCategories.forEach((cat) => {
            const el = document.querySelector(`[data-category-id="${cat.id}"]`)
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [filteredCategories])

    const scrollCategories = (dir: 'left' | 'right') => {
        if (categoryScrollerRef.current) {
            const scrollAmount = categoryScrollerRef.current.offsetWidth / 2
            categoryScrollerRef.current.scrollBy({
                left: dir === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            })
        }
    }

    return (
        <div className="min-h-screen bg-[#f7f7f5] dark:bg-gray-950 text-gray-900 dark:text-white">
            {/* Header cover */}
            <div className="relative h-[390px] sm:h-[440px] lg:h-[480px] bg-black overflow-hidden">
                <div className="absolute inset-0 w-full">
                    {restaurant.cover_url ? (
                        <Image
                            src={restaurant.cover_url}
                            alt={restaurant.name}
                            fill
                            className="object-cover object-center"
                            priority
                            unoptimized
                        />
                    ) : (
                        <div
                            className="w-full h-full"
                            style={{
                                background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                            }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>

                <div className="absolute inset-0 flex flex-col">
                    <div className="flex-1" />
                    <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-5 sm:pb-8">
                        <div className="max-w-2xl rounded-3xl bg-black/35 backdrop-blur-xl border border-white/15 p-4 sm:p-6 shadow-2xl">
                            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-xl ring-1 ring-white/30 flex-shrink-0 relative">
                                    {restaurant.logo_url ? (
                                        <Image
                                            src={restaurant.logo_url}
                                            alt={restaurant.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-white text-2xl font-black"
                                            style={{ backgroundColor: primary }}
                                        >
                                            {restaurant.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight truncate">
                                        {restaurant.name}
                                    </h1>
                                    <div
                                        className="w-14 h-1 rounded mt-1"
                                        style={{ backgroundColor: primary }}
                                    />
                                </div>
                            </div>

                            {restaurant.address && (
                                <div className="flex items-center gap-2 mb-3 text-sm text-white/85">
                                    <MapPin className="w-4 h-4 shrink-0" style={{ color: primary }} />
                                    <span>{restaurant.address}</span>
                                </div>
                            )}

                            {restaurant.description && (
                                <p className="text-sm sm:text-base text-white/75 mb-4 line-clamp-2 leading-relaxed">
                                    {restaurant.description}
                                </p>
                            )}

                            {restaurant.phone && (
                                <Link
                                    href={`tel:${restaurant.phone}`}
                                    className="inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-white hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-lg"
                                    style={{ backgroundColor: primary }}
                                >
                                    <Phone className="w-5 h-5" />
                                    Appeler
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/70 dark:border-gray-800 px-4 sm:px-6 py-4">
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher dans le menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-gray-100/80 dark:bg-gray-800 rounded-2xl text-gray-700 dark:text-white placeholder-gray-500 border border-transparent focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-inner"
                        style={{ ['--tw-ring-color' as string]: primary }}
                    />
                </div>
            </div>

            {/* Categories bar */}
            <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/70 dark:border-gray-800 shadow-sm">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 pt-3">
                    <h2 className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                        Catégories
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-100 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-amber-300 dark:hover:bg-gray-700"
                            aria-label="Changer le thème clair ou sombre"
                            title="Changer le thème"
                        >
                            <Moon className="h-4 w-4 dark:hidden" />
                            <Sun className="hidden h-4 w-4 dark:block" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollCategories('left')}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollCategories('right')}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={categoryScrollerRef}
                    className="max-w-6xl mx-auto flex gap-2 sm:gap-3 overflow-x-auto px-4 sm:px-6 py-3 scrollbar-hide scroll-smooth"
                >
                    {categories.map((cat) => {
                        const active = selectedCategory === cat.id
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.id)}
                                ref={(el) => {
                                    categoryRefs.current[cat.id] = el
                                }}
                                className="flex flex-col items-center gap-2 min-w-max rounded-2xl px-3 py-2 transition-all duration-200 border border-transparent"
                                style={{
                                    backgroundColor: active ? primary + '20' : undefined,
                                    boxShadow: active ? `0 2px 8px ${primary}40` : undefined,
                                    transform: active ? 'scale(1.05)' : 'scale(1)',
                                }}
                            >
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm relative bg-gray-200 dark:bg-gray-700 shrink-0">
                                    {cat.image_url ? (
                                        <Image
                                            src={cat.image_url}
                                            alt={cat.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full flex items-center justify-center text-white text-lg"
                                            style={{ backgroundColor: primary }}
                                        >
                                            🍽️
                                        </div>
                                    )}
                                </div>
                                <div
                                    className="text-xs sm:text-sm font-semibold whitespace-nowrap"
                                    style={{ color: active ? primary : undefined }}
                                >
                                    {cat.name}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Dishes */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10 sm:space-y-14">
                {filteredCategories.length === 0 ? (
                    <p className="text-center text-gray-500 py-16">
                        Aucun plat trouvé
                    </p>
                ) : (
                    filteredCategories.map((cat) => (
                        <section key={cat.id} data-category-id={cat.id} className="space-y-5 scroll-mt-32">
                            <CategoryHeader category={cat} color={primary} />
                            <div className="grid grid-cols-2 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                                {cat.dishes.map((dish) => (
                                    <button
                                        key={dish.id}
                                        type="button"
                                        onClick={() => setSelectedDish(dish)}
                                        className="text-left w-full h-full rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                    >
                                        <DishCard
                                            dish={dish}
                                            color={primary}
                                            currency={restaurant.currency}
                                        />
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </main>

            {/* Footer consultation only */}
            <p className="text-center text-xs text-gray-400 pb-10 px-4">
                Menu consultatif · Commandez auprès de votre serveur
            </p>

            {/* Popup détails plat */}
            {selectedDish && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedDish(null)}
                        aria-label="Fermer"
                    />
                    <div className="relative z-10 w-full sm:max-w-xl max-h-[92dvh] flex flex-col bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">    {/* Image — ~40% du popup */}
                        <div className="relative aspect-[16/10] max-h-[46vh] shrink-0 bg-gray-100 dark:bg-gray-700">
                            {selectedDish.image_url ? (
                                <Image
                                    src={selectedDish.image_url}
                                    alt={selectedDish.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-5xl text-white"
                                    style={{ backgroundColor: primary + '80' }}
                                >
                                    🍽️
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setSelectedDish(null)}
                                className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/75 transition backdrop-blur"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenu scrollable */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                    {selectedDish.name}
                                </h3>
                                <span
                                    className="shrink-0 text-sm font-bold text-white rounded-xl py-2 px-3"
                                    style={{ backgroundColor: primary }}
                                >
                                    {formatPrice(selectedDish.price, restaurant.currency)}
                                </span>
                            </div>

                            {selectedDish.description ? (
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed break-words">
                                    {selectedDish.description}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Aucune description</p>
                            )}

                            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                                Menu consultatif · Commandez auprès de votre serveur
                            </p>
                        </div>

                        {/* Footer fixe */}
                        <div className="shrink-0 p-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setSelectedDish(null)}
                                className="w-full py-3 rounded-xl font-medium text-white transition hover:opacity-90"
                                style={{ backgroundColor: primary }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Scroll to top */}
            <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 text-white p-3 rounded-full shadow-xl hover:-translate-y-1 active:scale-95 transition-all z-50"
                style={{ backgroundColor: secondary }}
            >
                <ArrowUp className="w-6 h-6" />
            </button>
        </div>
    )
}

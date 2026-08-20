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
} from 'lucide-react'

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
    const price = new Intl.NumberFormat('fr-FR').format(dish.price)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition border border-gray-200 dark:border-gray-700">
            <div className="relative h-48 md:h-56">
                {dish.image_url ? (
                    <Image
                        src={dish.image_url}
                        alt={dish.name}
                        fill
                        className="object-cover"
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
            <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h4 className="text-lg md:text-xl text-gray-800 dark:text-white font-medium truncate">
                        {dish.name}
                    </h4>
                    {dish.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {dish.description}
                        </p>
                    )}
                </div>
                <div
                    className="text-sm md:text-base font-bold text-white rounded-xl py-2 px-4 shrink-0 self-start sm:self-center"
                    style={{ backgroundColor: color }}
                >
                    {price} {currency.toLowerCase()}
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
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-sm bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
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
                <h3 className="sm:text-2xl text-lg font-bold text-gray-800 dark:text-white truncate">
                    {category.name}
                </h3>
                <span
                    className="text-sm text-white px-3 py-1 rounded-full shrink-0"
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
        <div className="min-h-screen sm:container mx-auto bg-gray-50 dark:bg-gray-900">
            {/* Header cover */}
            <div className="relative h-[50vh] sm:h-[60vh] bg-black overflow-hidden">
                <div className="h-[55%] relative w-full">
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
                    <div className="relative z-10 px-4 sm:px-5 pb-6 sm:pb-8">
                        <div className="rounded-3xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/10 p-5 md:p-8 shadow-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg flex-shrink-0 relative">
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
                                    <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight truncate">
                                        {restaurant.name}
                                    </h1>
                                    <div
                                        className="w-14 h-1 rounded mt-1"
                                        style={{ backgroundColor: primary }}
                                    />
                                </div>
                            </div>

                            {restaurant.address && (
                                <div className="flex items-center gap-2 mb-4 text-sm text-white/80">
                                    <MapPin className="w-4 h-4 shrink-0" style={{ color: primary }} />
                                    <span>{restaurant.address}</span>
                                </div>
                            )}

                            {restaurant.description && (
                                <p className="text-sm text-white/70 mb-4 line-clamp-2">
                                    {restaurant.description}
                                </p>
                            )}

                            {restaurant.phone && (
                                <Link
                                    href={`tel:${restaurant.phone}`}
                                    className="flex items-center justify-center gap-3 w-full py-3 rounded-xl font-medium text-white hover:opacity-90 active:scale-95 transition"
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
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 sm:px-6 py-4">
                <div className="relative max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher dans le menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-700 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-gray-600 transition"
                        style={{ ['--tw-ring-color' as string]: primary }}
                    />
                </div>
            </div>

            {/* Categories bar */}
            <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 shadow-md">
                <div className="flex items-center justify-between px-4 pt-2">
                    <h2 className="text-base md:text-xl font-bold text-gray-900 dark:text-white">
                        Catégories
                    </h2>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => scrollCategories('left')}
                            className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollCategories('right')}
                            className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={categoryScrollerRef}
                    className="flex gap-4 md:gap-6 overflow-x-auto p-4 scrollbar-hide"
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
                                className="flex flex-col items-center min-w-[100px] md:min-w-[120px] rounded-lg p-2 transition"
                                style={{
                                    backgroundColor: active ? primary + '20' : undefined,
                                    boxShadow: active ? `0 2px 8px ${primary}40` : undefined,
                                    transform: active ? 'scale(1.05)' : 'scale(1)',
                                }}
                            >
                                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full overflow-hidden mb-2 shadow-md relative bg-gray-200 dark:bg-gray-700">
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
                                <span
                                    className="text-xs md:text-sm font-semibold text-center"
                                    style={{ color: active ? primary : undefined }}
                                >
                                    {cat.name}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Dishes */}
            <div className="px-2 sm:px-4 py-6 space-y-12">
                {filteredCategories.length === 0 ? (
                    <p className="text-center text-gray-500 py-16">
                        Aucun plat trouvé
                    </p>
                ) : (
                    filteredCategories.map((cat) => (
                        <div key={cat.id} data-category-id={cat.id} className="space-y-6">
                            <CategoryHeader category={cat} color={primary} />
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {cat.dishes.map((dish) => (
                                    <button
                                        key={dish.id}
                                        type="button"
                                        onClick={() => setSelectedDish(dish)}
                                        className="text-left w-full"
                                    >
                                        <DishCard
                                            dish={dish}
                                            color={primary}
                                            currency={restaurant.currency}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer consultation only */}
            <p className="text-center text-xs text-gray-400 pb-8 px-4">
                Menu consultatif · Commandez auprès de votre serveur
            </p>

            {/* Popup détails plat */}
            {selectedDish && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedDish(null)}
                        aria-label="Fermer"
                    />
                    <div className="relative z-10 w-full sm:w-[50%] h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">    {/* Image — ~40% du popup */}
                        <div className="relative h-[50%] min-h-[140px] shrink-0 bg-gray-100 dark:bg-gray-700">
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
                                className="absolute top-3 right-3 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenu scrollable */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                                    {selectedDish.name}
                                </h3>
                                <span
                                    className="shrink-0 text-sm font-bold text-white rounded-xl py-2 px-3"
                                    style={{ backgroundColor: primary }}
                                >
                                    {new Intl.NumberFormat('fr-FR').format(selectedDish.price)}{' '}
                                    {restaurant.currency}
                                </span>
                            </div>

                            {selectedDish.description ? (
                                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed break-all">
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
                className="fixed bottom-6 right-6 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition z-50"
                style={{ backgroundColor: secondary }}
            >
                <ArrowUp className="w-6 h-6" />
            </button>
        </div>
    )
}
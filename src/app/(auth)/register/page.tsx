'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { UtensilsCrossed } from 'lucide-react'

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

export default function RegisterPage() {
    const router = useRouter()
    const [fullName, setFullName] = useState('')
    const [restaurantName, setRestaurantName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const supabase = createClient()
        const slug = slugify(restaurantName)

        // 1. Créer le compte Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        })

        if (authError || !authData.user) {
            toast.error(authError?.message || 'Erreur lors de la création du compte')
            setLoading(false)
            return
        }

        const userId = authData.user.id

        // 2. Créer le restaurant
        const { data: restaurant, error: restaurantError } = await supabase
            .from('restaurants')
            .insert({
                name: restaurantName,
                slug,
                currency: 'FDJ',
            })
            .select('id')
            .single()

        if (restaurantError || !restaurant) {
            toast.error(restaurantError?.message || 'Erreur lors de la création du restaurant')
            setLoading(false)
            return
        }

        // 3. Créer le profil OWNER
        const { error: profileError } = await supabase.from('profiles').insert({
            user_id: userId,
            restaurant_id: restaurant.id,
            full_name: fullName,
            role: 'OWNER',
        })

        if (profileError) {
            toast.error(profileError.message)
            setLoading(false)
            return
        }

        toast.success('Restaurant créé avec succès !')
        router.push('/dashboard')
        router.refresh()
    }

    return (
        <div className="w-full">
            <div className="mb-8 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md mb-4">
                    <UtensilsCrossed className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">QRMenu POS</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Créer votre restaurant
                </p>
            </div>
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">Créer votre restaurant</CardTitle>
                    <CardDescription>
                        Commencez à utiliser QRMenu POS en quelques secondes
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Votre nom complet</Label>
                            <Input
                                id="fullName"
                                placeholder="Mohamed Ali"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="restaurantName">Nom du restaurant</Label>
                            <Input
                                id="restaurantName"
                                placeholder="Restaurant Al-Baraka"
                                value={restaurantName}
                                onChange={(e) => setRestaurantName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="vous@restaurant.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Minimum 6 caractères"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Création en cours...' : 'Créer mon restaurant'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Déjà un compte ?{' '}
                            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                                Se connecter
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
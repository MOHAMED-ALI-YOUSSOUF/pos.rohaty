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

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        toast.success('Connexion réussie')
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
                    Connectez-vous à votre restaurant
                </p>
            </div>
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">Connexion</CardTitle>
                    <CardDescription>
                        Accédez à votre espace QRMenu POS
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2">
                        <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                            {loading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                        <div className="text-sm text-center text-muted-foreground">
                            Pas encore de compte ?{' '}
                            <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                                Créer un restaurant
                            </Link>
                        </div>
                        <div className="text-sm text-center">
                            <Link href="/forgot-password" className="underline underline-offset-4 hover:text-primary">
                                Mot de passe oublié ?
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
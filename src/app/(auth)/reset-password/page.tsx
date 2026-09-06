'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [checkingLink, setCheckingLink] = useState(true)
  const [validLink, setValidLink] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    async function verifyRecoverySession() {
      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error && active) {
          setValidLink(false)
          setCheckingLink(false)
          return
        }

        window.history.replaceState({}, document.title, window.location.pathname)
      }

      const { data } = await supabase.auth.getSession()
      if (!active) return

      setValidLink(Boolean(data.session))
      setCheckingLink(false)
    }

    void verifyRecoverySession()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || (event !== 'PASSWORD_RECOVERY' && event !== 'SIGNED_IN')) return
      setValidLink(Boolean(session))
      setCheckingLink(false)
    })

    return () => {
      active = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault()

    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (password !== confirmation) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    toast.success('Mot de passe modifié. Vous pouvez vous connecter.')
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">QRMenu POS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sécurisez votre compte</p>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Choisissez un nouveau mot de passe d’au moins 8 caractères.
          </CardDescription>
        </CardHeader>

        {checkingLink ? (
          <CardContent className="space-y-3" aria-label="Vérification du lien">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          </CardContent>
        ) : validLink ? (
          <form onSubmit={handleReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
                <Input
                  id="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
                {loading ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Button className="w-full">
              <Link href="/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

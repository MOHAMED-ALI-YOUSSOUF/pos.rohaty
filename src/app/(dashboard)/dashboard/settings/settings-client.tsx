'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ExternalLink, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { PUBLIC_URL } from '@/lib/constants'

type Restaurant = {
    id: string
    name: string
    slug: string
    description: string | null
    phone: string | null
    address: string | null
    currency: string
    primary_color: string | null
    logo_url: string | null
    cover_url: string | null
}

function slugify(text: string) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

export function SettingsClient({
    restaurant,
    role,
}: {
    restaurant: Restaurant
    role: string
}) {
    const [name, setName] = useState(restaurant.name)
    const [slug, setSlug] = useState(restaurant.slug)
    const [description, setDescription] = useState(restaurant.description || '')
    const [phone, setPhone] = useState(restaurant.phone || '')
    const [address, setAddress] = useState(restaurant.address || '')
    const [currency, setCurrency] = useState(restaurant.currency || 'FDJ')
    const [primaryColor, setPrimaryColor] = useState(
        restaurant.primary_color || '#f97316'
    )
    const [logoUrl, setLogoUrl] = useState(restaurant.logo_url || '')
    const [coverUrl, setCoverUrl] = useState(restaurant.cover_url || '')
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const canEdit = role === 'OWNER' || role === 'MANAGER'

    const publicUrl = useMemo(() => {
        return `${PUBLIC_URL}/${slug}`
    }, [slug])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canEdit) {
            toast.error('Permission insuffisante')
            return
        }
        if (!name.trim() || !slug.trim()) {
            toast.error('Nom et slug obligatoires')
            return
        }

        setLoading(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('restaurants')
            .update({
                name: name.trim(),
                slug: slugify(slug),
                description: description.trim() || null,
                phone: phone.trim() || null,
                address: address.trim() || null,
                currency: currency.trim() || 'FDJ',
                primary_color: primaryColor,
                logo_url: logoUrl.trim() || null,
                cover_url: coverUrl.trim() || null,
            })
            .eq('id', restaurant.id)

        if (error) {
            toast.error(
                error.message.includes('duplicate')
                    ? 'Ce slug est déjà utilisé'
                    : error.message
            )
            setLoading(false)
            return
        }

        setSlug(slugify(slug))
        toast.success('Paramètres enregistrés')
        setLoading(false)
    }

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl)
            setCopied(true)
            toast.success('Lien copié')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Impossible de copier')
        }
    }

    const downloadQr = () => {
        const svg = document.querySelector('#menu-qr-code svg')
        if (!svg) {
            toast.error('QR introuvable')
            return
        }

        const serializer = new XMLSerializer()
        const source = serializer.serializeToString(svg)
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(blob)

        const a = document.createElement('a')
        a.href = url
        a.download = `qr-menu-${slug || 'restaurant'}.svg`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('QR téléchargé')
    }
    const downloadQrPng = () => {
        const svg = document.querySelector('#menu-qr-code svg')
        if (!svg) return

        const serializer = new XMLSerializer()
        const source = serializer.serializeToString(svg)
        const img = new Image()
        const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
            const canvas = document.createElement('canvas')
            canvas.width = 512
            canvas.height = 512
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 512, 512)
            ctx.drawImage(img, 0, 0, 512, 512)
            URL.revokeObjectURL(url)

            const png = canvas.toDataURL('image/png')
            const a = document.createElement('a')
            a.href = png
            a.download = `qr-menu-${slug || 'restaurant'}.png`
            a.click()
            toast.success('QR PNG téléchargé')
        }

        img.src = url
    }
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground mt-1">
                    Infos du restaurant et menu public
                </p>
            </div>

            {/* Lien menu public */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Menu public (QR)</CardTitle>
                    <CardDescription>
                        Lien à mettre dans le QR Code des tables
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input value={publicUrl} readOnly className="font-mono text-sm" />
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={copyLink}>
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                            <Button type="button" variant="outline" >
                                <Link href={`/${slug}`} target="_blank">
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    {/* QR */}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div
                            id="menu-qr-code"
                            className="bg-white p-4 rounded-xl border shadow-sm"
                        >
                            <QRCodeSVG
                                value={publicUrl}
                                size={180}
                                level="M"
                                includeMargin={false}
                                bgColor="#ffffff"
                                fgColor="#111111"
                            />
                        </div>

                        <div className="space-y-3 text-center sm:text-left">
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Scannez ce QR pour ouvrir le menu. Imprimez-le et placez-le sur
                                chaque table.
                            </p>
                            <div className="flex justify-center gap-2">


                                <Button type="button" variant="outline" onClick={downloadQr}>
                                    <Download className="mr-2 h-4 w-4" />
                                    SVG
                                </Button>
                                <Button type="button" variant="outline" onClick={downloadQrPng}>
                                    <Download className="mr-2 h-4 w-4" />
                                    PNG
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Formulaire */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Informations</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={!canEdit}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL) *</Label>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={!canEdit}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                {slugify(slug) || '…'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={!canEdit}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    disabled={!canEdit}
                                    placeholder="+253 …"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Devise</Label>
                                <Input
                                    id="currency"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Input
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="primaryColor">Couleur principale</Label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    id="primaryColor"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    disabled={!canEdit}
                                    className="h-10 w-14 cursor-pointer rounded border"
                                />
                                <Input
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    disabled={!canEdit}
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Logo</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                disabled={!canEdit || loading}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    try {
                                        setLoading(true)
                                        const { uploadRestaurantFile } = await import('@/lib/upload')
                                        const url = await uploadRestaurantFile(restaurant.id, file, 'logo')
                                        setLogoUrl(url)
                                        toast.success('Logo uploadé')
                                    } catch (err: any) {
                                        toast.error(err.message || 'Erreur upload')
                                    } finally {
                                        setLoading(false)
                                    }
                                }}
                            />
                            {logoUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover border" />
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Couverture</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                disabled={!canEdit || loading}
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    try {
                                        setLoading(true)
                                        const { uploadRestaurantFile } = await import('@/lib/upload')
                                        const url = await uploadRestaurantFile(restaurant.id, file, 'cover')
                                        setCoverUrl(url)
                                        toast.success('Cover uploadée')
                                    } catch (err: any) {
                                        toast.error(err.message || 'Erreur upload')
                                    } finally {
                                        setLoading(false)
                                    }
                                }}
                            />
                            {coverUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={coverUrl} alt="Cover" className="h-24 w-full max-w-sm rounded-lg object-cover border" />
                            )}
                        </div>



                        {canEdit && (
                            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
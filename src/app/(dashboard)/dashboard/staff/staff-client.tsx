// 'use client'

// import { useState } from 'react'
// import { createClient } from '@/lib/supabase/client'
// import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select'
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
//     DialogFooter,
// } from '@/components/ui/dialog'
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from '@/components/ui/alert-dialog'
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from '@/components/ui/table'
// import { Badge } from '@/components/ui/badge'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Switch } from '@/components/ui/switch'
// import { Plus, Pencil, Users } from 'lucide-react'
// import { toast } from 'sonner'

// type StaffMember = {
//     id: string
//     full_name: string
//     role: string
//     is_active: boolean
//     user_id: string
//     created_at: string
// }

// const ROLE_LABELS: Record<string, string> = {
//     OWNER: 'Propriétaire',
//     MANAGER: 'Manager',
//     CASHIER: 'Caissier',
//     WAITER: 'Serveur',
// }

// const ASSIGNABLE_ROLES = ['MANAGER', 'CASHIER', 'WAITER'] as const

// export function StaffClient({
//     staff: initialStaff,
//     currentProfileId,
//     currentRole,
//     restaurantId,
// }: {
//     staff: StaffMember[]
//     currentProfileId: string
//     currentRole: string
//     restaurantId: string
// }) {
//     const [staff, setStaff] = useState(initialStaff)
//     const [open, setOpen] = useState(false)
//     const [editing, setEditing] = useState<StaffMember | null>(null)
//     const [loading, setLoading] = useState(false)

//     // Invite form
//     const [fullName, setFullName] = useState('')
//     const [email, setEmail] = useState('')
//     const [password, setPassword] = useState('')
//     const [role, setRole] = useState<string>('WAITER')

//     const canManage = currentRole === 'OWNER' || currentRole === 'MANAGER'

//     const resetForm = () => {
//         setFullName('')
//         setEmail('')
//         setPassword('')
//         setRole('WAITER')
//         setEditing(null)
//     }

//     const openCreate = () => {
//         if (!canManage) {
//             toast.error('Permission insuffisante')
//             return
//         }
//         resetForm()
//         setOpen(true)
//     }

//     const openEdit = (member: StaffMember) => {
//         if (!canManage) return
//         if (member.role === 'OWNER' && currentRole !== 'OWNER') {
//             toast.error('Seul le propriétaire peut modifier ce compte')
//             return
//         }
//         setEditing(member)
//         setFullName(member.full_name)
//         setRole(member.role === 'OWNER' ? 'OWNER' : member.role)
//         setEmail('')
//         setPassword('')
//         setOpen(true)
//     }

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault()
//         if (!canManage) return

//         setLoading(true)
//         const supabase = createClient()

//         if (editing) {
//             // Update name + role (pas OWNER → autre sauf si déjà OWNER)
//             const newRole =
//                 editing.role === 'OWNER' ? 'OWNER' : role === 'OWNER' ? editing.role : role

//             const { data, error } = await supabase
//                 .from('profiles')
//                 .update({
//                     full_name: fullName.trim(),
//                     role: newRole,
//                 })
//                 .eq('id', editing.id)
//                 .eq('restaurant_id', restaurantId)
//                 .select()
//                 .single()

//             if (error) {
//                 toast.error(error.message)
//                 setLoading(false)
//                 return
//             }

//             setStaff((prev) => prev.map((s) => (s.id === editing.id ? { ...s, ...data } : s)))
//             toast.success('Membre mis à jour')
//             setOpen(false)
//             resetForm()
//             setLoading(false)
//             return
//         }

//         // Création : signup + profile
//         if (!email.trim() || !password || password.length < 6) {
//             toast.error('Email et mot de passe (6+ caractères) obligatoires')
//             setLoading(false)
//             return
//         }

//         // Note MVP : signUp depuis le client peut connecter le nouvel user.
//         // Pour un vrai SaaS, passer par une Edge Function + service role.
//         const { data: authData, error: authError } = await supabase.auth.signUp({
//             email: email.trim(),
//             password,
//             options: {
//                 data: {
//                     full_name: fullName.trim(),
//                 },
//             },
//         })

//         if (authError || !authData.user) {
//             toast.error(authError?.message || 'Erreur création compte')
//             setLoading(false)
//             return
//         }

//         const { data: profile, error: profileError } = await supabase
//             .from('profiles')
//             .insert({
//                 user_id: authData.user.id,
//                 restaurant_id: restaurantId,
//                 full_name: fullName.trim(),
//                 role: role === 'OWNER' ? 'WAITER' : role,
//                 is_active: true,
//             })
//             .select()
//             .single()

//         if (profileError) {
//             toast.error(profileError.message)
//             setLoading(false)
//             return
//         }

//         setStaff((prev) => [...prev, profile])
//         toast.success('Membre ajouté — il peut se connecter avec cet email')
//         setOpen(false)
//         resetForm()
//         setLoading(false)

//         // Important : le signUp peut avoir changé la session.
//         // L'OWNER devra peut‑être se reconnecter (limitation MVP sans Edge Function).
//         toast.message('Si vous êtes déconnecté, reconnectez-vous avec votre compte.')
//     }

//     const toggleActive = async (member: StaffMember) => {
//         if (!canManage) return
//         if (member.id === currentProfileId) {
//             toast.error('Vous ne pouvez pas vous désactiver')
//             return
//         }
//         if (member.role === 'OWNER') {
//             toast.error('Impossible de désactiver le propriétaire')
//             return
//         }

//         const newValue = !member.is_active
//         setStaff((prev) =>
//             prev.map((s) => (s.id === member.id ? { ...s, is_active: newValue } : s))
//         )

//         const supabase = createClient()
//         const { error } = await supabase
//             .from('profiles')
//             .update({ is_active: newValue })
//             .eq('id', member.id)

//         if (error) {
//             setStaff((prev) =>
//                 prev.map((s) =>
//                     s.id === member.id ? { ...s, is_active: member.is_active } : s
//                 )
//             )
//             toast.error(error.message)
//         }
//     }

//     return (
//         <div className="space-y-6">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                 <div>
//                     <h1 className="text-3xl font-bold tracking-tight">Équipe</h1>
//                     <p className="text-muted-foreground mt-1">
//                         Serveurs, caissiers et managers
//                     </p>
//                 </div>
//                 {canManage && (
//                     <Button onClick={openCreate}>
//                         <Plus className="mr-2 h-4 w-4" />
//                         Ajouter un membre
//                     </Button>
//                 )}
//             </div>

//             {staff.length === 0 ? (
//                 <Card className="border-dashed">
//                     <CardContent className="flex flex-col items-center justify-center py-16 text-center">
//                         <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
//                             <Users className="h-7 w-7 text-primary" />
//                         </div>
//                         <h3 className="text-lg font-semibold">Aucun membre</h3>
//                     </CardContent>
//                 </Card>
//             ) : (
//                 <Card>
//                     <CardHeader>
//                         <CardTitle className="text-base font-medium">
//                             {staff.length} membre{staff.length > 1 ? 's' : ''}
//                         </CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <Table>
//                             <TableHeader>
//                                 <TableRow>
//                                     <TableHead>Nom</TableHead>
//                                     <TableHead>Rôle</TableHead>
//                                     <TableHead className="text-center">Statut</TableHead>
//                                     {canManage && <TableHead className="text-right">Actions</TableHead>}
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 {staff.map((member) => (
//                                     <TableRow key={member.id}>
//                                         <TableCell className="font-medium">
//                                             {member.full_name}
//                                             {member.id === currentProfileId && (
//                                                 <span className="text-xs text-muted-foreground ml-2">(vous)</span>
//                                             )}
//                                         </TableCell>
//                                         <TableCell>
//                                             {ROLE_LABELS[member.role] || member.role}
//                                         </TableCell>
//                                         <TableCell className="text-center">
//                                             <Badge variant={member.is_active ? 'default' : 'secondary'}>
//                                                 {member.is_active ? 'Actif' : 'Inactif'}
//                                             </Badge>
//                                         </TableCell>
//                                         {canManage && (
//                                             <TableCell className="text-right">
//                                                 <div className="flex items-center justify-end gap-2">
//                                                     {member.role !== 'OWNER' && member.id !== currentProfileId && (
//                                                         <Switch
//                                                             checked={member.is_active}
//                                                             onCheckedChange={() => toggleActive(member)}
//                                                         />
//                                                     )}
//                                                     <Button
//                                                         variant="ghost"
//                                                         size="icon"
//                                                         onClick={() => openEdit(member)}
//                                                         disabled={member.role === 'OWNER' && currentRole !== 'OWNER'}
//                                                     >
//                                                         <Pencil className="h-4 w-4" />
//                                                     </Button>
//                                                 </div>
//                                             </TableCell>
//                                         )}
//                                     </TableRow>
//                                 ))}
//                             </TableBody>
//                         </Table>
//                     </CardContent>
//                 </Card>
//             )}

//             <Dialog open={open} onOpenChange={setOpen}>
//                 <DialogContent>
//                     <DialogHeader>
//                         <DialogTitle>
//                             {editing ? 'Modifier le membre' : 'Ajouter un membre'}
//                         </DialogTitle>
//                     </DialogHeader>
//                     <form onSubmit={handleSubmit} className="space-y-4">
//                         <div className="space-y-2">
//                             <Label>Nom complet *</Label>
//                             <Input
//                                 value={fullName}
//                                 onChange={(e) => setFullName(e.target.value)}
//                                 required
//                             />
//                         </div>

//                         {!editing && (
//                             <>
//                                 <div className="space-y-2">
//                                     <Label>Email *</Label>
//                                     <Input
//                                         type="email"
//                                         value={email}
//                                         onChange={(e) => setEmail(e.target.value)}
//                                         required
//                                     />
//                                 </div>
//                                 <div className="space-y-2">
//                                     <Label>Mot de passe temporaire *</Label>
//                                     <Input
//                                         type="password"
//                                         value={password}
//                                         onChange={(e) => setPassword(e.target.value)}
//                                         required
//                                         minLength={6}
//                                     />
//                                 </div>
//                             </>
//                         )}

//                         {(!editing || editing.role !== 'OWNER') && (
//                             <div className="space-y-2">
//                                 <Label>Rôle</Label>
//                                 <Select value={role} onValueChange={setRole}>
//                                     <SelectTrigger>
//                                         <SelectValue />
//                                     </SelectTrigger>
//                                     <SelectContent>
//                                         {ASSIGNABLE_ROLES.map((r) => (
//                                             <SelectItem key={r} value={r}>
//                                                 {ROLE_LABELS[r]}
//                                             </SelectItem>
//                                         ))}
//                                     </SelectContent>
//                                 </Select>
//                             </div>
//                         )}

//                         <DialogFooter>
//                             <Button type="button" variant="outline" onClick={() => setOpen(false)}>
//                                 Annuler
//                             </Button>
//                             <Button type="submit" disabled={loading}>
//                                 {loading ? 'Enregistrement...' : editing ? 'Mettre à jour' : 'Créer'}
//                             </Button>
//                         </DialogFooter>
//                     </form>
//                 </DialogContent>
//             </Dialog>
//         </div>
//     )
// }
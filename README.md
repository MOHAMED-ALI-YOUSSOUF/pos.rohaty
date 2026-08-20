# QRMenu Restaurant POS

Solution MVP pour restaurants : **menu digital par QR Code** + **caisse POS** (prise de commande, ticket cuisine, encaissement, ticket client).

> Le client consulte le menu sur son téléphone.  
> Il ne commande **pas** depuis le QR dans cette version — la commande est prise par le serveur / la caisse.

---

## Fonctionnalités

### Menu public (QR)
- Page menu responsive `/r/[slug]`
- Catégories, produits, images, recherche
- Popup détail plat
- Personnalisation (couleur, logo, cover)
- QR Code généré dans les paramètres

### POS (caisse)
- Sélection table ou à emporter
- Ajout produits / quantités / note
- Envoi commande → ticket cuisine
- Liste des commandes à encaisser (recherche par table)
- Encaissement (Espèces, D-Money, Waafi, Carte, Autre)
- Ticket client après paiement
- Annulation de commande
- Tout le flux commande + paiement dans l’interface POS

### Back-office
- Authentification (compte propriétaire)
- Catégories, produits, tables (CRUD)
- Upload images (Supabase Storage)
- Paramètres restaurant + lien menu + QR
- Dashboard stats (aujourd’hui, hier, semaine, mois, année, plage custom)
- Historique des commandes

---

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** (Auth, PostgreSQL, RLS, Storage)
- **Zustand** (panier POS)
- **qrcode.react** (QR menu)

---

## Prérequis

- Node.js 18+
- Compte [Supabase](https://supabase.com)

---

## Installation

```bash
git clone https://github.com/VOTRE_USER/VOTRE_REPO.git
cd VOTRE_REPO
npm install
-- Donnees de demonstration du menu public /restaurant-al-baraka.
-- Ce fichier est rejouable : les memes identifiants sont mis a jour sans
-- creer de doublons.

create or replace function public.seed_restaurant_al_baraka()
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  restaurant_uuid uuid;
begin
  restaurant_uuid := 'e6df7a8c-f763-4922-8151-0fed3a7b23d8'::uuid;

  if not exists (
    select 1
      from public.restaurants
     where id = restaurant_uuid
  ) then
    insert into public.restaurants (
      id, name, slug, description, phone, address, currency,
      primary_color, logo_url, cover_url
    ) values (
      restaurant_uuid,
      'Restaurant Al-Baraka',
      'restaurant-al-baraka',
      'Cuisine généreuse aux saveurs de la Corne de l''Afrique, préparée chaque jour avec des produits frais.',
      '+253 77 12 34 56',
      'Héron, Djibouti-ville',
      'FDJ',
      '#B45309',
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=85'
    );
  else
    update public.restaurants
       set name = 'Restaurant Al-Baraka',
           description = 'Cuisine généreuse aux saveurs de la Corne de l''Afrique, préparée chaque jour avec des produits frais.',
           phone = '+253 77 12 34 56',
           address = 'Héron, Djibouti-ville',
           currency = 'FDJ',
           primary_color = '#B45309',
           logo_url = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
           cover_url = 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=85'
     where id = restaurant_uuid;
  end if;

  insert into public.categories (
    id, restaurant_id, name, description, image_url, sort_order, is_active
  ) values
    ('a1ba1000-0000-4000-8000-000000000001', restaurant_uuid, 'Entrées', 'Pour commencer en douceur', 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=900&q=80', 1, true),
    ('a1ba1000-0000-4000-8000-000000000002', restaurant_uuid, 'Plats traditionnels', 'Les spécialités de la maison', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80', 2, true),
    ('a1ba1000-0000-4000-8000-000000000003', restaurant_uuid, 'Grillades', 'Grillées à la commande', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80', 3, true),
    ('a1ba1000-0000-4000-8000-000000000004', restaurant_uuid, 'Desserts', 'Une touche sucrée pour terminer', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80', 4, true),
    ('a1ba1000-0000-4000-8000-000000000005', restaurant_uuid, 'Boissons', 'Fraîches ou chaudes', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80', 5, true)
  on conflict (id) do update set
    restaurant_id = excluded.restaurant_id,
    name = excluded.name,
    description = excluded.description,
    image_url = excluded.image_url,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

  insert into public.products (
    id, restaurant_id, category_id, name, description, price,
    image_url, sort_order, is_available
  ) values
    ('a1ba2000-0000-4000-8000-000000000001', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000001', 'Samboussa viande', 'Trois beignets croustillants farcis au bœuf épicé.', 900, 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=80', 1, true),
    ('a1ba2000-0000-4000-8000-000000000002', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000001', 'Salade Al-Baraka', 'Tomate, concombre, oignon, citron et herbes fraîches.', 1200, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80', 2, true),
    ('a1ba2000-0000-4000-8000-000000000003', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000001', 'Soupe de lentilles', 'Lentilles corail, cumin et pain maison.', 1000, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80', 3, true),
    ('a1ba2000-0000-4000-8000-000000000004', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000002', 'Skoudehkaris agneau', 'Riz parfumé mijoté avec agneau tendre et épices djiboutiennes.', 2800, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80', 1, true),
    ('a1ba2000-0000-4000-8000-000000000005', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000002', 'Fah-fah', 'Soupe traditionnelle de viande, légumes et piment vert.', 2400, 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=900&q=80', 2, true),
    ('a1ba2000-0000-4000-8000-000000000006', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000002', 'Riz au poulet', 'Poulet mariné, riz basmati et légumes de saison.', 2300, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=80', 3, true),
    ('a1ba2000-0000-4000-8000-000000000007', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000002', 'Pâtes suugo', 'Spaghettis, sauce tomate épicée et viande hachée.', 2000, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80', 4, true),
    ('a1ba2000-0000-4000-8000-000000000008', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000003', 'Brochettes de bœuf', 'Bœuf mariné grillé, riz et salade.', 2600, 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=900&q=80', 1, true),
    ('a1ba2000-0000-4000-8000-000000000009', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000003', 'Demi-poulet grillé', 'Poulet aux épices, frites et sauce maison.', 2500, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=80', 2, true),
    ('a1ba2000-0000-4000-8000-000000000010', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000003', 'Poisson grillé', 'Poisson du jour mariné au citron et servi avec du riz.', 3200, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80', 3, true),
    ('a1ba2000-0000-4000-8000-000000000011', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000004', 'Halwa maison', 'Confiserie traditionnelle parfumée à la cardamome.', 700, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80', 1, true),
    ('a1ba2000-0000-4000-8000-000000000012', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000004', 'Crème caramel', 'Crème onctueuse au caramel maison.', 900, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80', 2, true),
    ('a1ba2000-0000-4000-8000-000000000013', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000005', 'Jus de mangue frais', 'Mangue mixée à la commande.', 800, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=900&q=80', 1, true),
    ('a1ba2000-0000-4000-8000-000000000014', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000005', 'Jus de bissap', 'Infusion d’hibiscus fraîche et légèrement sucrée.', 600, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80', 2, true),
    ('a1ba2000-0000-4000-8000-000000000015', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000005', 'Shaah cadays', 'Thé au lait somalien, cardamome et cannelle.', 500, 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=80', 3, true),
    ('a1ba2000-0000-4000-8000-000000000016', restaurant_uuid, 'a1ba1000-0000-4000-8000-000000000005', 'Eau minérale', 'Bouteille 50 cl.', 300, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80', 4, true)
  on conflict (id) do update set
    restaurant_id = excluded.restaurant_id,
    category_id = excluded.category_id,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    image_url = excluded.image_url,
    sort_order = excluded.sort_order,
    is_available = excluded.is_available;

  return restaurant_uuid;
end;
$$;

-- Le seed reste une operation d'administration et n'est pas exposé via l'API.
revoke execute on function public.seed_restaurant_al_baraka() from public, anon, authenticated;

-- Supabase execute automatiquement seed.sql apres les migrations lors de
-- `supabase db reset`. La fonction peut aussi etre relancee manuellement.
select public.seed_restaurant_al_baraka();

-- Correctif pour les bases ayant deja applique la premiere migration.
-- La liste des modes est geree par PAYMENT_METHODS dans l'application ; la
-- base garantit seulement qu'un restaurant conserve au moins un mode actif.

alter table public.restaurants
    drop constraint if exists restaurants_enabled_payment_methods_check;

alter table public.restaurants
    add constraint restaurants_enabled_payment_methods_check check (
        cardinality(enabled_payment_methods) > 0
    );

alter table public.restaurants
    alter column enabled_payment_methods set default
    array['CASH', 'DMONEY', 'WAAFI', 'CARD', 'CAC_PAY', 'SABA_PAY', 'DAHABPLUS', 'OTHER']::text[];

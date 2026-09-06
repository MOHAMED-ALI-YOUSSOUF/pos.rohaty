alter table public.restaurants
    add column if not exists enabled_payment_methods text[] not null
    default array['CASH', 'DMONEY', 'WAAFI', 'CARD', 'CAC_PAY', 'SABA_PAY', 'DAHABPLUS', 'OTHER']::text[];

alter table public.restaurants
    drop constraint if exists restaurants_enabled_payment_methods_check;

alter table public.restaurants
    add constraint restaurants_enabled_payment_methods_check check (
        cardinality(enabled_payment_methods) > 0
    );

comment on column public.restaurants.enabled_payment_methods is
    'Payment methods enabled by the restaurant and offered in the POS';

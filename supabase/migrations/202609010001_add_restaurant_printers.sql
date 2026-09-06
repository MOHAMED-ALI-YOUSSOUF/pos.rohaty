alter table public.restaurants
    add column if not exists kitchen_printer_name text null,
    add column if not exists receipt_printer_name text null;

comment on column public.restaurants.kitchen_printer_name is 'QZ Tray printer used for kitchen tickets';
comment on column public.restaurants.receipt_printer_name is 'QZ Tray printer used for customer receipts';

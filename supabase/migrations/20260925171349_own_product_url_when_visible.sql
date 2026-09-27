-- E1-09: an own product can be loaded before its app URL is known (the
-- invoicing app has no production domain yet), but it cannot be shown on the
-- site without one.

alter table public.service
  drop constraint service_own_product_needs_app_url;

alter table public.service
  add constraint service_visible_own_product_needs_app_url
    check (kind <> 'own_product' or not visible or external_app_url is not null);

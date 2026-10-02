-- E4-08: settings edited in the panel. Adds the phone and email shown on the
-- site, and turns the social networks into a list (label and URL), so more
-- can be added (TikTok, YouTube…). Both are public: the site shows them.

insert into public.site_settings (key, value, is_public)
values ('contact', '{"phone": "0999843108", "email": "hola@siete8.com"}', true)
on conflict (key) do nothing;

-- {"facebook": url, "instagram": url, "linkedin": url} → [{label, url}, …],
-- in that order. Only if it still is the old object.
update public.site_settings
set value = (
  select coalesce(jsonb_agg(jsonb_build_object('label', n.label, 'url', value ->> n.key) order by n.ord), '[]'::jsonb)
  from (values ('facebook', 'Facebook', 1), ('instagram', 'Instagram', 2), ('linkedin', 'LinkedIn', 3))
    as n (key, label, ord)
  where value ? n.key
)
where key = 'social' and jsonb_typeof(value) = 'object';

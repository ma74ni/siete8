-- The signature's installation answer mentions Siete8's own cloud invoicing
-- system, which also works from a phone (docs/COPY.md §4).

update public.service_faq f
set answer = 'Sí, si lo necesitas. Te ayudamos a instalarla en el sistema donde facturas o firmas. Y si todavía no tienes dónde facturar, tenemos un sistema de facturación electrónica en la nube que también puedes usar desde el celular: pregúntanos por WhatsApp.'
from public.service s
where s.id = f.service_id
  and s.slug = 'firma-electronica'
  and f.question = '¿Me ayudan a instalarla?';

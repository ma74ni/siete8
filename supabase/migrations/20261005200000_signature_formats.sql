-- The signature comes as a .p12 file or in the cloud, at the same price;
-- both together or a token are quoted by WhatsApp (docs/COPY.md §4).

update public.service_faq f
set answer = 'Elige el que te sirva, al mismo precio: archivo .p12, para instalar en tu computadora o cargar en tu sistema de facturación, o en la nube, para firmar desde el celular con una app, sin instalar nada. Si necesitas los dos o un token (la firma en un pendrive), escríbenos por WhatsApp y te cotizamos.'
from public.service s
where s.id = f.service_id
  and s.slug = 'firma-electronica'
  and f.question = '¿En qué formato la recibo?';

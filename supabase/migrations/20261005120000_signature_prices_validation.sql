-- Signature plans after the new distribution agreement (October 2026): new
-- prices, the legal representative at the same price as a natural person,
-- and requirements that match the issuer's validation policy, with nothing
-- added. The same data is in seed.sql for fresh databases, where this
-- migration runs before the plans exist.

-- Prices without VAT ------------------------------------------------------------

update public.plan p
set price_without_vat = v.price
from (values
  ('natural', 7, 'day', 6.99),
  ('natural', 30, 'day', 7.99),
  ('natural', 1, 'year', 17.99),
  ('natural', 2, 'year', 26.99),
  ('natural', 3, 'year', 36.99),
  ('natural', 4, 'year', 45.99),
  ('natural', 5, 'year', 53.99),
  ('legal_entity', 1, 'year', 17.99),
  ('legal_entity', 2, 'year', 26.99),
  ('legal_entity', 3, 'year', 36.99),
  ('legal_entity', 4, 'year', 45.99),
  ('legal_entity', 5, 'year', 53.99)
) as v (holder, duration_value, duration_unit, price),
  public.service s
where s.id = p.service_id
  and s.slug = 'firma-electronica'
  and p.holder_type = v.holder::public.holder_type
  and p.duration_value = v.duration_value
  and p.duration_unit = v.duration_unit::public.duration_unit;

-- Requirements (docs/COPY.md §4) -----------------------------------------------

delete from public.requirement r
using public.plan p, public.service s
where r.plan_id = p.id and s.id = p.service_id and s.slug = 'firma-electronica';

insert into public.requirement (plan_id, text, required, sort_order)
select pl.id, r.text, r.required, r.sort_order
from (values
  ('natural', 'Tu cédula vigente, por ambos lados: fotos nítidas o PDF.', true, 1),
  ('natural', 'Una selfie sosteniendo tu cédula en la mano.', true, 2),
  ('natural', 'Tu dirección: provincia, ciudad y calle.', true, 3),
  ('natural', 'Tu RUC en PDF, si tienes uno (por ejemplo, para facturar).', false, 4),
  ('natural', 'Un correo personal al que tengas acceso.', true, 5),
  ('natural', 'Un celular activo.', true, 6),
  ('natural', 'Si tienes 65 años o más: un video corto en el que digas la fecha de hoy, tu nombre completo y que autorizas emitir tu firma a tu correo.', false, 7),
  ('legal_entity', 'Tu cédula vigente, por ambos lados: fotos nítidas o PDF.', true, 1),
  ('legal_entity', 'Una selfie sosteniendo tu cédula en la mano.', true, 2),
  ('legal_entity', 'RUC de la empresa, en PDF.', true, 3),
  ('legal_entity', 'Nombramiento vigente en PDF: la carta de aceptación y su inscripción en el Registro Mercantil o el ente que corresponda (pueden ir en un solo archivo).', true, 4),
  ('legal_entity', 'Escritura de constitución de la empresa, en PDF.', true, 5),
  ('legal_entity', 'Tu correo personal y un celular activo.', true, 6)
) as r (holder, text, required, sort_order)
join public.plan pl on pl.holder_type = r.holder::public.holder_type
join public.service s on s.id = pl.service_id and s.slug = 'firma-electronica';

-- Who issues the signature: the service is not presented as Siete8's own,
-- and the issuer's name and brand are not used ------------------------------

insert into public.service_faq (service_id, question, answer, sort_order)
select s.id,
  '¿Quién emite la firma?',
  'Una entidad de certificación acreditada por ARCOTEL, la autoridad que regula las firmas electrónicas en Ecuador. Siete8 es distribuidor autorizado: recibimos tu solicitud, revisamos que tus requisitos estén completos y te acompañamos hasta que tengas tu firma instalada.',
  6
from public.service s
where s.slug = 'firma-electronica'
  and not exists (
    select 1 from public.service_faq f
    where f.service_id = s.id and f.question = '¿Quién emite la firma?'
  );

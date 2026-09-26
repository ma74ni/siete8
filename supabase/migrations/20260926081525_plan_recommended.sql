-- E3-01: mark the recommended plan of each holder type ("recomendado para
-- facturar", DESIGN §7: highlighted row). The panel can change it later.

alter table public.plan
  add column recommended boolean not null default false;

-- At most one recommended plan per service and holder type.
create unique index plan_one_recommended_idx
  on public.plan (service_id, holder_type)
  where recommended;

-- Signature: the 1-year plan of each holder type (COPY §3, §4). For databases
-- seeded before this migration; the seed sets it too.
update public.plan p
set recommended = true
from public.service s
where s.id = p.service_id
  and s.slug = 'firma-electronica'
  and p.duration_value = 1
  and p.duration_unit = 'year';

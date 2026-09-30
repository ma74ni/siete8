-- E6-01: the twelve projects of the previous portfolio (docs/SRS.md, annex F),
-- from docs/data/portafolio-anterior.json with its typos fixed. They go in
-- unpublished: the admin reviews them in the panel, uploads the images and
-- publishes. The client's name is stored but not shown (no confirmed
-- permission); the sector comes from the original description, and where it
-- does not say, it is marked as pending. Statuses per annex F; none links out.
-- Runs once: a project whose slug already exists is left untouched.

insert into public.project
  (title, slug, status, client_name, show_client_name, sector, summary, tech_stack, featured, published, sort_order)
values
  ('BI de seguros y reportería a entes de control', 'bi-de-seguros-y-reporteria-a-entes-de-control', 'internal',
   null, false, 'Seguros',
   'Inteligencia de negocio y reportes para todas las entidades de control del Ecuador.',
   array['SQL Server', 'PDI', 'MicroStrategy'], true, false, 1),
  ('Encuestas hospitalarias', 'encuestas-hospitalarias', 'archived',
   null, false, 'Salud',
   'Aplicación web de gestión y tabulación de encuestas, integrada con los sistemas de la clínica.',
   array['PHP MVC', 'SQL Server', 'Oracle', 'PDI', 'MicroStrategy'], true, false, 2),
  ('Bypass de aplicaciones BI', 'bypass-de-aplicaciones-bi', 'internal',
   null, false, '[COPY PENDIENTE: sector]',
   'Aplicación web para gestionar y administrar aplicaciones de inteligencia de negocio.',
   array['Angular', 'Firebase', 'MicroStrategy'], true, false, 3),
  ('Encuestas A100', 'encuestas-a100', 'archived',
   null, false, '[COPY PENDIENTE: sector]',
   'Aplicación web de administración, gestión y tabulación de encuestas.',
   array['PHP MVC', 'SQL Server', 'PDI', 'MicroStrategy'], false, false, 4),
  ('DWH y piloto de BI con Hypercards', 'dwh-y-piloto-de-bi-con-hypercards', 'internal',
   null, false, '[COPY PENDIENTE: sector]',
   'Creación del DWH de la empresa, acompañado de un piloto de inteligencia de negocio con Hypercards.',
   array['SQL Server', 'MySQL', 'PDI', 'MicroStrategy'], false, false, 5),
  ('Constelaciones Ecuador', 'constelaciones-ecuador', 'replaced',
   'Constelaciones Ecuador', false, 'Terapia familiar',
   'Sitio web de Constelaciones Ecuador, empresa especializada en terapia de constelaciones familiares.',
   array['WordPress'], false, false, 6),
  ('Piloto de BI con Hypercards (banca)', 'piloto-de-bi-con-hypercards-banca', 'internal',
   null, false, 'Banca',
   'Piloto de inteligencia de negocio con Hypercards.',
   array['SQL Server', 'MicroStrategy'], false, false, 7),
  ('FIGLAC', 'figlac', 'replaced',
   'FIGLAC', false, 'Microfinanzas',
   'Sitio web para gestionar la información de FIGLAC, una organización sin fines de lucro especializada en brindar servicios a instituciones de microfinanzas.',
   array['WordPress'], false, false, 8),
  ('DWH y BI empresarial', 'dwh-y-bi-empresarial', 'internal',
   null, false, '[COPY PENDIENTE: sector]',
   'Implementación del DWH e inteligencia de negocio de la empresa.',
   array['SQL Server', 'PDI', 'MicroStrategy'], false, false, 9),
  ('C&G Comercio Exterior', 'cg-comercio-exterior', 'archived',
   'C&G Comercio Exterior', false, 'Comercio exterior',
   'Landing page de C&G Comercio Exterior, empresa que brinda servicios de exportaciones e importaciones en el Ecuador.',
   array['WordPress'], false, false, 10),
  ('MBS Connection Flower', 'mbs-connection-flower', 'archived',
   'MBS Connection Flower', false, 'Exportación de flores',
   'Sitio web de MBS Connection Flower, empresa especializada en exportación de flores.',
   array['WordPress'], false, false, 11),
  ('Banco de Motos', 'banco-de-motos', 'replaced',
   'Banco de Motos', false, 'Venta y reparación de motos',
   'Aplicación web de Banco de Motos, empresa especializada en venta y reparación de motocicletas nuevas y usadas.',
   array['Laravel', 'MySQL'], false, false, 12)
on conflict (slug) do nothing;

-- Services of each project (annex F, "Tipo"), for the portfolio filter. For
-- databases seeded before this migration; the seed links them too.
insert into public.project_service (project_id, service_id)
select p.id, s.id
from (values
  ('bi-de-seguros-y-reporteria-a-entes-de-control', 'analisis-de-datos-bi'),
  ('encuestas-hospitalarias', 'apps-y-desarrollo-a-medida'),
  ('bypass-de-aplicaciones-bi', 'apps-y-desarrollo-a-medida'),
  ('encuestas-a100', 'apps-y-desarrollo-a-medida'),
  ('dwh-y-piloto-de-bi-con-hypercards', 'analisis-de-datos-bi'),
  ('constelaciones-ecuador', 'paginas-web'),
  ('piloto-de-bi-con-hypercards-banca', 'analisis-de-datos-bi'),
  ('figlac', 'paginas-web'),
  ('dwh-y-bi-empresarial', 'analisis-de-datos-bi'),
  ('cg-comercio-exterior', 'landing-page'),
  ('mbs-connection-flower', 'paginas-web'),
  ('banco-de-motos', 'apps-y-desarrollo-a-medida')
) as link (project_slug, service_slug)
join public.project p on p.slug = link.project_slug
join public.service s on s.slug = link.service_slug
on conflict do nothing;

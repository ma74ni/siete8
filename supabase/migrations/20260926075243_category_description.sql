-- E2-04: short description of each category, shown in the Servicios menu.
-- Texts from docs/COPY.md §2. Categories without an approved text stay null
-- and the menu shows only their name.

alter table public.category
  add column description text
    check (description is null or length(trim(description)) > 0);

update public.category set description = case slug
  when 'presencia-digital'
    then 'Para que tu negocio se vea profesional y te encuentren en internet.'
  when 'tramites-y-cumplimiento'
    then 'Para cumplir con el SRI y firmar documentos sin filas ni papeles.'
  when 'desarrollo-y-datos'
    then 'Para procesos que ya no caben en una hoja de cálculo.'
end
where slug in ('presencia-digital', 'tramites-y-cumplimiento', 'desarrollo-y-datos');

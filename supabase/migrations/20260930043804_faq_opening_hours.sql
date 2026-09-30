-- Opening hours apply every day, including holidays (COPY §5). Only replaces
-- the original answer, so an edit made from the panel is kept.

update public.service_faq
set answer = 'Todos los días, incluidos feriados, de 07:00 a 20:00. Si escribes fuera de ese horario, atendemos tu solicitud desde las 07:00 del día siguiente.'
where question = '¿En qué horario atienden?'
  and answer = 'De 07:00 a 20:00. Si escribes fuera de ese horario, atendemos tu solicitud desde las 07:00 del día siguiente.';

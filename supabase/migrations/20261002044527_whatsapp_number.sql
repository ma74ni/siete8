-- New commercial WhatsApp number (WhatsApp Business), from 1 October 2026:
-- 0967155626 replaces 0961128233. Only changes the row if it still has the
-- old number, so a value set from the panel later is kept.
update public.site_settings
set value = jsonb_set(jsonb_set(value, '{number}', '"0967155626"'), '{wa_me}', '"593967155626"')
where key = 'whatsapp' and value->>'number' = '0961128233';

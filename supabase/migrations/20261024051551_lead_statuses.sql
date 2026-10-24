-- E11-05 (RF-CRM-18): lead statuses new, contacted, proposal_sent, won, lost.
-- "Cerrado" becomes "Ganado": renaming the value keeps every lead and every
-- lead_status_event row, so the history is preserved. On its own migration:
-- a value added to an enum cannot be used in the transaction that adds it.

alter type public.lead_status rename value 'closed' to 'won';
alter type public.lead_status add value 'proposal_sent' after 'contacted';

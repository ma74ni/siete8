-- Temporary: verifies that CI fails on a broken migration. Reverted next commit.
alter table public.category add column broken integer not null default 'not a number';

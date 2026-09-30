-- When an article was announced on the social networks (Make webhook, sent
-- by netlify/functions/announce-posts.mts). Null means not yet: published
-- articles whose date has passed and are still null get announced once.
-- Existing articles stay null on purpose, so the first one works as the test.
alter table public.post
  add column social_sent_at timestamptz;

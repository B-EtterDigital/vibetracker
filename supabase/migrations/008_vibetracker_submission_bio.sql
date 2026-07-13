-- A viber's own bio on a public profile, set with `vibetracker profile --bio` and carried on the
-- submission. Additive + nullable so older rows and the read path degrade to the "add a bio" hint.
alter table public.vibetracker_submissions add column if not exists bio text;

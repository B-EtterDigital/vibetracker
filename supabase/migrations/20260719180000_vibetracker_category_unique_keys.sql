-- The category-aware rollups (20260719160000) key aggregates by provider+category+(day|model), but
-- the unique constraints were still (submission_id, provider, day|model) — so a provider used in two
-- categories on one day (Higgsfield image+video) collided on insert, failing the WHOLE batch and
-- emptying the profile's monthly bars + per-model list (real incident 2026-07-19). Add category to
-- both uniqueness keys. category is nullable, so NULLS treated as distinct is fine for legacy rows.
ALTER TABLE public.vibetracker_submission_provider_daily
  DROP CONSTRAINT IF EXISTS vibetracker_submission_provider__submission_id_provider_day_key;
ALTER TABLE public.vibetracker_submission_provider_daily
  ADD CONSTRAINT vibetracker_sub_provider_daily_uniq UNIQUE (submission_id, provider, category, day);

ALTER TABLE public.vibetracker_submission_provider_models
  DROP CONSTRAINT IF EXISTS vibetracker_submission_provide_submission_id_provider_model_key;
ALTER TABLE public.vibetracker_submission_provider_models
  ADD CONSTRAINT vibetracker_sub_provider_models_uniq UNIQUE (submission_id, provider, category, model);

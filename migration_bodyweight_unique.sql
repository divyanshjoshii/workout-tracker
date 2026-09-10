-- Required by logBodyWeight()'s upsert, which replaced a read-then-write that
-- could double-insert if you logged twice at once. Run once in the Supabase
-- SQL editor. The old code already prevented same-day duplicates, so this
-- should apply cleanly; if it errors, you have duplicate rows to clear first.
ALTER TABLE public.body_weight_entries
  ADD CONSTRAINT body_weight_entries_user_date_key UNIQUE (user_id, date);

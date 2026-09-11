-- Performance migration. Run once in the Supabase SQL editor. Safe to re-run.
--
-- 1. Adds indexes on the columns row level security and the app's queries
--    filter on.
-- 2. Recreates every policy with auth.uid() written as (select auth.uid()).
--    Postgres then works out the user id once per query instead of once per
--    row. This is Supabase's documented recommendation, and each policy is
--    otherwise identical: who can read or write what does not change.

BEGIN;

-- Indexes. Postgres does not index foreign keys on its own, so each policy that
-- checks ownership through a parent table, and each query filtering on these
-- columns, was scanning the whole table.
CREATE INDEX IF NOT EXISTS splits_user_id_idx ON public.splits (user_id);
CREATE INDEX IF NOT EXISTS split_days_split_id_idx ON public.split_days (split_id);
CREATE INDEX IF NOT EXISTS workout_sessions_user_id_created_at_idx ON public.workout_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workout_exercises_session_id_idx ON public.workout_exercises (session_id);
CREATE INDEX IF NOT EXISTS workout_exercises_exercise_id_idx ON public.workout_exercises (exercise_id);
CREATE INDEX IF NOT EXISTS workout_sets_workout_exercise_id_idx ON public.workout_sets (workout_exercise_id);
CREATE INDEX IF NOT EXISTS workout_templates_user_id_idx ON public.workout_templates (user_id, template_order);
CREATE INDEX IF NOT EXISTS template_exercises_template_id_idx ON public.template_exercises (template_id);

-- Policies, recreated with the wrapped call.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "Exercises are viewable by everyone" ON public.exercises;
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorite_exercises;
CREATE POLICY "Users can view own favorites" ON public.favorite_exercises FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorite_exercises;
CREATE POLICY "Users can insert own favorites" ON public.favorite_exercises FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorite_exercises;
CREATE POLICY "Users can delete own favorites" ON public.favorite_exercises FOR DELETE USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can view own splits" ON public.splits;
CREATE POLICY "Users can view own splits" ON public.splits FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can manage own splits" ON public.splits;
CREATE POLICY "Users can manage own splits" ON public.splits FOR ALL USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can view own split days" ON public.split_days;
CREATE POLICY "Users can view own split days" ON public.split_days FOR SELECT USING (EXISTS (SELECT 1 FROM public.splits WHERE splits.id = split_days.split_id AND splits.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can manage own split days" ON public.split_days;
CREATE POLICY "Users can manage own split days" ON public.split_days FOR ALL USING (EXISTS (SELECT 1 FROM public.splits WHERE splits.id = split_days.split_id AND splits.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can view own sessions" ON public.workout_sessions;
CREATE POLICY "Users can view own sessions" ON public.workout_sessions FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.workout_sessions;
CREATE POLICY "Users can manage own sessions" ON public.workout_sessions FOR ALL USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can view own workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = workout_exercises.session_id AND workout_sessions.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can manage own workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can manage own workout exercises" ON public.workout_exercises FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = workout_exercises.session_id AND workout_sessions.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can view own workout sets" ON public.workout_sets;
CREATE POLICY "Users can view own workout sets" ON public.workout_sets FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_exercises JOIN public.workout_sessions ON workout_sessions.id = workout_exercises.session_id WHERE workout_exercises.id = workout_sets.workout_exercise_id AND workout_sessions.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can manage own workout sets" ON public.workout_sets;
CREATE POLICY "Users can manage own workout sets" ON public.workout_sets FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_exercises JOIN public.workout_sessions ON workout_sessions.id = workout_exercises.session_id WHERE workout_exercises.id = workout_sets.workout_exercise_id AND workout_sessions.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can view own body weight" ON public.body_weight_entries;
CREATE POLICY "Users can view own body weight" ON public.body_weight_entries FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can manage own body weight" ON public.body_weight_entries;
CREATE POLICY "Users can manage own body weight" ON public.body_weight_entries FOR ALL USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can view own templates" ON public.workout_templates;
CREATE POLICY "Users can view own templates" ON public.workout_templates FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can manage own templates" ON public.workout_templates;
CREATE POLICY "Users can manage own templates" ON public.workout_templates FOR ALL USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can view own template exercises" ON public.template_exercises;
CREATE POLICY "Users can view own template exercises" ON public.template_exercises FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_templates WHERE workout_templates.id = template_exercises.template_id AND workout_templates.user_id = (select auth.uid())));
DROP POLICY IF EXISTS "Users can manage own template exercises" ON public.template_exercises;
CREATE POLICY "Users can manage own template exercises" ON public.template_exercises FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_templates WHERE workout_templates.id = template_exercises.template_id AND workout_templates.user_id = (select auth.uid())));

COMMIT;

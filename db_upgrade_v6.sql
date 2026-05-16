ALTER TABLE public.workout_exercises ADD COLUMN superset_id uuid DEFAULT NULL;
ALTER TABLE public.template_exercises ADD COLUMN superset_id uuid DEFAULT NULL;

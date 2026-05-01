-- 1. Add image_url column if it doesn't exist
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Delete ALL existing exercises to clear out duplicates and old data
-- Note: If you already have workout_sets linked to exercises, this will fail due to foreign key constraints.
-- Since this is an MVP, we can cascade delete, or simply just delete exercises that aren't used.
-- A safer approach: Remove exact duplicates but keep one. Since we want to wipe the slate clean, we will truncate the exercises table cascade if you don't mind losing past workout sets, OR we can just ignore duplicates. 
-- Since we are replacing the DB, let's delete exercises that have NOT been used in workout_sets yet.
DELETE FROM public.exercises 
WHERE id NOT IN (SELECT DISTINCT exercise_id FROM public.workout_exercises);

-- 3. Make the name column unique so duplicates can never be inserted again
ALTER TABLE public.exercises ADD CONSTRAINT unique_exercise_name UNIQUE (name);

-- 4. Now run the exercises_v2.sql script!

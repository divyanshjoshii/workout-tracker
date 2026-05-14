-- Version 3 Database Upgrade: Adds features for workout sets (dropsets, supersets, notes, bodyweight)

ALTER TABLE public.workout_sets 
ADD COLUMN IF NOT EXISTS set_type text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS is_bodyweight boolean DEFAULT false;

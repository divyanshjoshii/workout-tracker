-- V4 Upgrade: Templates ordering and Hall of Fame Customization

-- Add template_order to workout_templates to support drag-and-drop arrangement
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS template_order integer DEFAULT 0;

-- Set sequential order for existing templates
WITH numbered_templates AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM public.workout_templates
)
UPDATE public.workout_templates
SET template_order = numbered_templates.rn
FROM numbered_templates
WHERE public.workout_templates.id = numbered_templates.id;

-- Add hall_of_fame to profiles to support custom picking of exactly 3 exercises
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hall_of_fame uuid[] DEFAULT '{}'::uuid[];

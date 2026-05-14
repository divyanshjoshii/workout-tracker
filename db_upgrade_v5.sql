-- V5 Upgrade: Add explicit template linking to split days
ALTER TABLE public.split_days 
ADD COLUMN default_template_id UUID REFERENCES public.workout_templates(id) ON DELETE SET NULL;

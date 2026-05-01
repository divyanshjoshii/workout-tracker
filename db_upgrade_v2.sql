-- Phase 10: Dynamic Muscle Targeting
-- Run this script in the Supabase SQL Editor

ALTER TABLE public.split_days 
ADD COLUMN IF NOT EXISTS target_muscles text[] DEFAULT '{}';

ALTER TABLE public.template_exercises 
ADD COLUMN IF NOT EXISTS target_sets integer DEFAULT 3;

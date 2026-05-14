-- Profiles Table
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  display_name text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Exercises Table (Public)
CREATE TABLE public.exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  muscle_group text NOT NULL,
  category text NOT NULL,
  equipment text,
  instructions text,
  image_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Favorite Exercises Table
CREATE TABLE public.favorite_exercises (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, exercise_id)
);

-- Splits Table
CREATE TABLE public.splits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Split Days Table
CREATE TABLE public.split_days (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  split_id uuid REFERENCES public.splits(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  day_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workout Sessions Table
CREATE TABLE public.workout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  split_day_id uuid REFERENCES public.split_days(id) ON DELETE SET NULL,
  name text NOT NULL,
  date date DEFAULT current_date NOT NULL,
  notes text,
  feeling text, -- e.g., 'Easy', 'Medium', 'Hard'
  duration_seconds integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workout Exercises Table
CREATE TABLE public.workout_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.workout_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  exercise_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workout Sets Table
CREATE TABLE public.workout_sets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id uuid REFERENCES public.workout_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number integer NOT NULL,
  weight numeric,
  reps integer NOT NULL,
  rpe numeric,
  set_type text DEFAULT 'normal',
  notes text,
  is_bodyweight boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Body Weight Entries Table
CREATE TABLE public.body_weight_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date date DEFAULT current_date NOT NULL,
  weight numeric NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workout Templates Table
CREATE TABLE public.workout_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Template Exercises Table
CREATE TABLE public.template_exercises (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid REFERENCES public.workout_templates(id) ON DELETE CASCADE NOT NULL,
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  exercise_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Exercises RLS (Public Read)
CREATE POLICY "Exercises are viewable by everyone" ON public.exercises FOR SELECT USING (true);

-- Favorite Exercises RLS
CREATE POLICY "Users can view own favorites" ON public.favorite_exercises FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorite_exercises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorite_exercises FOR DELETE USING (auth.uid() = user_id);

-- Splits & Split Days RLS
CREATE POLICY "Users can view own splits" ON public.splits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own splits" ON public.splits FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own split days" ON public.split_days FOR SELECT USING (EXISTS (SELECT 1 FROM public.splits WHERE splits.id = split_days.split_id AND splits.user_id = auth.uid()));
CREATE POLICY "Users can manage own split days" ON public.split_days FOR ALL USING (EXISTS (SELECT 1 FROM public.splits WHERE splits.id = split_days.split_id AND splits.user_id = auth.uid()));

-- Workout Sessions, Exercises, Sets RLS
CREATE POLICY "Users can view own sessions" ON public.workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sessions" ON public.workout_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = workout_exercises.session_id AND workout_sessions.user_id = auth.uid()));
CREATE POLICY "Users can manage own workout exercises" ON public.workout_exercises FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_sessions WHERE workout_sessions.id = workout_exercises.session_id AND workout_sessions.user_id = auth.uid()));

CREATE POLICY "Users can view own workout sets" ON public.workout_sets FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_exercises JOIN public.workout_sessions ON workout_sessions.id = workout_exercises.session_id WHERE workout_exercises.id = workout_sets.workout_exercise_id AND workout_sessions.user_id = auth.uid()));
CREATE POLICY "Users can manage own workout sets" ON public.workout_sets FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_exercises JOIN public.workout_sessions ON workout_sessions.id = workout_exercises.session_id WHERE workout_exercises.id = workout_sets.workout_exercise_id AND workout_sessions.user_id = auth.uid()));

-- Body Weight RLS
CREATE POLICY "Users can view own body weight" ON public.body_weight_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own body weight" ON public.body_weight_entries FOR ALL USING (auth.uid() = user_id);

-- Templates RLS
CREATE POLICY "Users can view own templates" ON public.workout_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON public.workout_templates FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own template exercises" ON public.template_exercises FOR SELECT USING (EXISTS (SELECT 1 FROM public.workout_templates WHERE workout_templates.id = template_exercises.template_id AND workout_templates.user_id = auth.uid()));
CREATE POLICY "Users can manage own template exercises" ON public.template_exercises FOR ALL USING (EXISTS (SELECT 1 FROM public.workout_templates WHERE workout_templates.id = template_exercises.template_id AND workout_templates.user_id = auth.uid()));

-- Handle New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid errors on multiple runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Countries table
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL,
  flag_emoji TEXT NOT NULL DEFAULT '🏳️',
  artist TEXT,
  song_title TEXT,
  year INTEGER NOT NULL DEFAULT 2026,
  is_active_finalist BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries are viewable by everyone" ON public.countries
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert countries" ON public.countries
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update countries" ON public.countries
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can delete countries" ON public.countries
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Predictions table
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_place UUID REFERENCES public.countries(id),
  second_place UUID REFERENCES public.countries(id),
  third_place UUID REFERENCES public.countries(id),
  fourth_place UUID REFERENCES public.countries(id),
  fifth_place UUID REFERENCES public.countries(id),
  last_place UUID REFERENCES public.countries(id),
  is_submitted BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  calculated_points INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL DEFAULT 2026,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all predictions" ON public.predictions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own predictions" ON public.predictions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON public.predictions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Favourite votes table
CREATE TABLE public.favourite_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_favourite UUID REFERENCES public.countries(id),
  second_favourite UUID REFERENCES public.countries(id),
  third_favourite UUID REFERENCES public.countries(id),
  is_submitted BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMP WITH TIME ZONE,
  year INTEGER NOT NULL DEFAULT 2026,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);

ALTER TABLE public.favourite_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all favourite votes" ON public.favourite_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own favourite votes" ON public.favourite_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favourite votes" ON public.favourite_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Settings table
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  predictions_locked BOOLEAN NOT NULL DEFAULT false,
  favourites_locked BOOLEAN NOT NULL DEFAULT false,
  active_year INTEGER NOT NULL DEFAULT 2026,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are viewable by authenticated users" ON public.settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can update settings" ON public.settings
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Actual results table (future-ready)
CREATE TABLE public.actual_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE DEFAULT 2026,
  first_place UUID REFERENCES public.countries(id),
  second_place UUID REFERENCES public.countries(id),
  third_place UUID REFERENCES public.countries(id),
  fourth_place UUID REFERENCES public.countries(id),
  fifth_place UUID REFERENCES public.countries(id),
  last_place UUID REFERENCES public.countries(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.actual_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actual results are viewable by authenticated" ON public.actual_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert actual results" ON public.actual_results
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Only admins can update actual results" ON public.actual_results
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON public.predictions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_favourite_votes_updated_at BEFORE UPDATE ON public.favourite_votes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_actual_results_updated_at BEFORE UPDATE ON public.actual_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row
INSERT INTO public.settings (predictions_locked, favourites_locked, active_year) VALUES (false, false, 2026);

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'Användare')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

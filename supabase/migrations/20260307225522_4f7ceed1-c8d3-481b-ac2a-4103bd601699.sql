
-- Add sweden_actual_position to actual_results
ALTER TABLE public.actual_results ADD COLUMN IF NOT EXISTS sweden_actual_position integer;

-- Add results_published to settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS results_published boolean NOT NULL DEFAULT false;

-- Add email to profiles for admin visibility
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update handle_new_user trigger to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nickname, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'Användare'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with emails
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- Enable pg_cron and pg_net for auto-publish
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

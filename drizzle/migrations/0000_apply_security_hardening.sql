-- Apply the security hardening that existed in supabase/migrations but was never applied live.
-- Adapted: handle_new_user keeps the permanent admin grant for gustav.slanesens@outlook.com.

-- Helper functions (SECURITY DEFINER, pinned search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.predictions_open()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT NOT predictions_locked AND now() < prediction_lock_time FROM public.settings LIMIT 1),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.favourites_open()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT NOT favourites_locked AND now() < prediction_lock_time FROM public.settings LIMIT 1),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_list_user_emails()
RETURNS TABLE (user_id uuid, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.email FROM public.profiles p WHERE public.is_admin();
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.predictions_open() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.favourites_open() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_user_emails() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.predictions_open() TO authenticated;
GRANT EXECUTE ON FUNCTION public.favourites_open() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_user_emails() TO authenticated;

-- profiles: readable without email, users may only change their own nickname
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (nickname) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Signup trigger: keep the permanent admin grant for the site owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nickname, email, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'Användare'),
    NEW.email,
    CASE WHEN NEW.email = 'gustav.slanesens@outlook.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$;

-- predictions: points are server-only, edits only while the window is open,
-- others' picks hidden until the deadline
REVOKE INSERT, UPDATE ON public.predictions FROM anon, authenticated;
GRANT INSERT (user_id, first_place, second_place, third_place, fourth_place, fifth_place,
              last_place, sweden_final_position, is_submitted, submitted_at, year)
  ON public.predictions TO authenticated;
GRANT UPDATE (user_id, first_place, second_place, third_place, fourth_place, fifth_place,
              last_place, sweden_final_position, is_submitted, submitted_at, year)
  ON public.predictions TO authenticated;

DROP POLICY IF EXISTS "Users can view all predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON public.predictions;

CREATE POLICY "Own predictions, or all after the deadline" ON public.predictions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR NOT public.predictions_open() OR public.is_admin());

CREATE POLICY "Users can insert their own predictions while open" ON public.predictions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.predictions_open());

CREATE POLICY "Users can update their own predictions while open" ON public.predictions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.predictions_open())
  WITH CHECK (auth.uid() = user_id AND public.predictions_open());

-- favourite_votes: same rules as predictions
DROP POLICY IF EXISTS "Users can view all favourite votes" ON public.favourite_votes;
DROP POLICY IF EXISTS "Users can insert their own favourite votes" ON public.favourite_votes;
DROP POLICY IF EXISTS "Users can update their own favourite votes" ON public.favourite_votes;

CREATE POLICY "Own favourites, or all after the deadline" ON public.favourite_votes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR NOT public.favourites_open() OR public.is_admin());

CREATE POLICY "Users can insert their own favourites while open" ON public.favourite_votes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.favourites_open());

CREATE POLICY "Users can update their own favourites while open" ON public.favourite_votes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.favourites_open())
  WITH CHECK (auth.uid() = user_id AND public.favourites_open());

-- actual_results: hidden from non-admins until published
DROP POLICY IF EXISTS "Actual results are viewable by authenticated" ON public.actual_results;
CREATE POLICY "Actual results visible to admins, or to everyone once published" ON public.actual_results
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR COALESCE((SELECT results_published FROM public.settings LIMIT 1), false)
  );
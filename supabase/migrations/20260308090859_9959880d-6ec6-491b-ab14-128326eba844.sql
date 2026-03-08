CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
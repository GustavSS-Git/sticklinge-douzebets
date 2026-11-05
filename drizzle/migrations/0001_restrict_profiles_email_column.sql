-- Complete the profiles hardening: hide the email column from non-admin reads.
-- Admins read emails via admin_list_user_emails(); the app selects only non-email columns.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, nickname, is_admin, created_at, updated_at) ON public.profiles TO authenticated;
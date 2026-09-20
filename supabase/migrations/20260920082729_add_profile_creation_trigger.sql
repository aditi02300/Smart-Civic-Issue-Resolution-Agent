/*
# Add auto-profile creation trigger

1. Problem
- The client-side signUp flow calls supabase.auth.signUp() then immediately
  inserts into profiles. But the profiles INSERT policy is TO authenticated
  only, and if no session is established after signUp (e.g. email confirmation
  on, or timing), the insert runs as anon and is blocked by RLS.
2. Solution
- Create a SECURITY DEFINER trigger function that fires AFTER INSERT on
  auth.users and inserts the corresponding profiles row automatically.
- The role is read from the user's raw_user_meta_data (set via signUp options).
- The trigger bypasses RLS (SECURITY DEFINER) so it works regardless of
  session state.
3. Security
- The function is SECURITY DEFINER with a fixed search_path.
- EXECUTE is revoked from anon and authenticated — only the trigger can fire it.
- The role value is validated against the CHECK constraint on profiles.role.
- The profile role column remains non-updatable by the client (UPDATE still revoked).
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

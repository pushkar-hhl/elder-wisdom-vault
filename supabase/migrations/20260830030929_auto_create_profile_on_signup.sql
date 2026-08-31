/*
# Auto-create family and user profile on signup

## Overview
Creates a database trigger that automatically creates a `families` row and a `users` row
when a new auth user signs up. The full_name and family_name are passed via
`raw_user_meta_data` during `supabase.auth.signUp()`.

## Changes
1. Create a `handle_new_user()` trigger function that:
   - Reads `full_name` and `family_name` from `raw_user_meta_data`
   - Creates a new row in `families` with the family name
   - Creates a new row in `users` with `id = NEW.id`, linked to the new family
2. Attach the trigger to `auth.users` on INSERT

## Security
- The trigger function runs with `SECURITY DEFINER` so it bypasses RLS
- This is necessary because the trigger fires before the client has a session,
  and RLS policies require `auth.uid()` which isn't available during trigger execution
- The function only creates rows for the new user — it cannot be called directly by clients

## Important Notes
1. The frontend must pass `full_name` and `family_name` in `signUp()` options.data
2. The trigger handles the entire profile creation server-side, eliminating race conditions
3. Existing auth users without profiles will NOT be retroactively fixed by this trigger
*/
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_family_id uuid;
  user_full_name text;
  fam_name text;
BEGIN
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  fam_name := NEW.raw_user_meta_data->>'family_name';

  IF user_full_name IS NULL THEN
    user_full_name := COALESCE(split_part(NEW.email, '@', 1), 'New User');
  END IF;

  IF fam_name IS NULL THEN
    fam_name := user_full_name || '''s Family';
  END IF;

  INSERT INTO public.families (name)
  VALUES (fam_name)
  RETURNING id INTO new_family_id;

  INSERT INTO public.users (id, family_id, full_name)
  VALUES (NEW.id, new_family_id, user_full_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

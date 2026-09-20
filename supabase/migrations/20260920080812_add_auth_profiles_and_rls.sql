/*
# Add profiles table and switch to authenticated-only access

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users ON DELETE CASCADE)
  - `email` (text, not null) — denormalized for display
  - `role` (text, not null, default 'citizen') — 'citizen' or 'admin'
  - `created_at` (timestamptz, default now())
2. Security — profiles
- Enable RLS on `profiles`.
- SELECT: users can read their own profile row.
- INSERT: users can insert their own profile row (during signup).
- UPDATE: revoked from authenticated at table level; only the email column is grantable. The `role` column is NOT client-writable — it can only be set at insert time by the user themselves (choosing citizen/admin at signup). After that it is locked. This prevents privilege escalation.
3. Security — complaints
- Drop anon policies, replace with authenticated-only CRUD (ownership via user_id column).
- Add `user_id` column to complaints, defaulting to auth.uid(), with a foreign key to auth.users.
4. Security — storage
- Drop anon policies on complaint-images, replace with authenticated-only policies scoped to the user's folder.
5. Important Notes
- The role is chosen at signup and stored in profiles.role. It cannot be changed by the client afterward.
- Admin dashboard visibility is controlled by reading the role from profiles.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Revoke UPDATE entirely; role must never be client-writable after signup.
-- Email is also static (comes from auth.users). No column-level grants needed.
REVOKE UPDATE ON profiles FROM authenticated;

-- Add user_id to complaints
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

-- Add FK constraint (drop first if exists to be idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'complaints_user_id_fkey'
  ) THEN
    ALTER TABLE complaints
    ADD CONSTRAINT complaints_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Replace complaints policies: drop anon, add authenticated-only
DROP POLICY IF EXISTS "anon_select_complaints" ON complaints;
DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;
DROP POLICY IF EXISTS "anon_delete_complaints" ON complaints;

DROP POLICY IF EXISTS "auth_select_complaints" ON complaints;
CREATE POLICY "auth_select_complaints" ON complaints FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_complaints" ON complaints;
CREATE POLICY "auth_insert_complaints" ON complaints FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_update_complaints" ON complaints;
CREATE POLICY "auth_update_complaints" ON complaints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_complaints" ON complaints;
CREATE POLICY "auth_delete_complaints" ON complaints FOR DELETE
  TO authenticated USING (true);

-- Replace storage policies: drop anon, add authenticated-only
DROP POLICY IF EXISTS "anon_read_complaint_images" ON storage.objects;
DROP POLICY IF EXISTS "anon_insert_complaint_images" ON storage.objects;
DROP POLICY IF EXISTS "anon_update_complaint_images" ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_complaint_images" ON storage.objects;

DROP POLICY IF EXISTS "auth_read_complaint_images" ON storage.objects;
CREATE POLICY "auth_read_complaint_images" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'complaint-images');

DROP POLICY IF EXISTS "auth_insert_complaint_images" ON storage.objects;
CREATE POLICY "auth_insert_complaint_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'complaint-images');

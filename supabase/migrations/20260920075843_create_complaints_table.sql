/*
# Create complaints table (single-tenant, no auth)

1. New Tables
- `complaints`
  - `id` (uuid, primary key, auto-generated)
  - `complaint_text` (text, not null) — the raw complaint description entered by the citizen
  - `location` (text, not null) — where the issue is located
  - `image_url` (text, nullable) — public URL of an uploaded photo, if provided
  - `issue` (text, nullable) — short issue name produced by AI analysis
  - `category` (text, nullable) — AI-assigned category (Waste Management / Roads / Electrical / Water / Drainage / Other)
  - `department` (text, nullable) — department the category maps to
  - `severity` (text, nullable) — AI-assigned severity (Low / Medium / High)
  - `reason` (text, nullable) — one-sentence explanation of the severity
  - `status` (text, not null, default 'Submitted') — lifecycle status of the complaint
  - `tracking_id` (text, not null, unique) — human-friendly tracking code shown to citizens
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())
2. Security
- Enable RLS on `complaints`.
- Allow anon + authenticated CRUD because the app is intentionally public/shared (no sign-in).
3. Indexes
- Index on `tracking_id` for fast lookups.
- Index on `status` for admin dashboard filtering.
*/

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_text text NOT NULL,
  location text NOT NULL,
  image_url text,
  issue text,
  category text,
  department text,
  severity text,
  reason text,
  status text NOT NULL DEFAULT 'Submitted',
  tracking_id text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_complaints" ON complaints;
CREATE POLICY "anon_select_complaints" ON complaints FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
CREATE POLICY "anon_insert_complaints" ON complaints FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;
CREATE POLICY "anon_update_complaints" ON complaints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_complaints" ON complaints;
CREATE POLICY "anon_delete_complaints" ON complaints FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_complaints_tracking_id ON complaints (tracking_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints (created_at DESC);

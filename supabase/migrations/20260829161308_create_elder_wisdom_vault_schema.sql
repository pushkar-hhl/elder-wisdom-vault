/*
# Elder Wisdom Vault — Initial Schema

## Overview
Creates the core tables for a family-based oral history preservation app.
Users belong to a family; each family has a vault of stories (audio/video recordings of elders).

## New Tables

### families
- `id` (uuid, PK) — unique family identifier
- `name` (text, not null) — family name
- `created_at` (timestamptz) — when the family was created

### users
- `id` (uuid, PK) — matches auth.users.id (1:1 with Supabase auth user)
- `family_id` (uuid, FK → families.id) — which family this user belongs to
- `full_name` (text, not null) — display name
- `created_at` (timestamptz) — when the user profile was created

### stories
- `id` (uuid, PK) — unique story identifier
- `family_id` (uuid, FK → families.id) — which family owns this story
- `uploaded_by` (uuid, FK → users.id) — who uploaded the story
- `elder_name` (text, not null) — name of the elder who told the story
- `region` (text) — geographic region
- `language_spoken` (text) — language used in the recording
- `title` (text, not null) — story title
- `audio_url` (text) — public URL to audio file in storage
- `video_url` (text) — public URL to video file in storage
- `transcript` (text) — full transcript of the recording
- `translation` (text) — English translation if applicable
- `summary` (text) — short summary of the story
- `tags` (text[]) — array of tags for filtering
- `festival_date` (date) — associated festival or ceremony date
- `created_at` (timestamptz) — when the story was uploaded

## Security (RLS)

All tables have RLS enabled with family-scoped access:
- **families**: Only members of a family can read/update their family row; any authenticated user can create (for signup).
- **users**: Users can read/update their own profile row; can read other members of their family.
- **stories**: Authenticated users can CRUD stories belonging to their own family (checked via family_id match against the user's family_id in the users table).

## Important Notes
1. The `users` table has a 1:1 relationship with `auth.users` — its `id` column IS the auth user's id.
2. Family-scoped access means a user in Family A cannot see stories from Family B.
3. The `users.id` does NOT have DEFAULT auth.uid() because it is set explicitly during signup (it must match the auth user's id).
4. Stories are scoped by `family_id`, not `user_id` — any family member can see all stories in the family vault.
*/

-- ============================================
-- Step 1: Create all tables first (no policies yet)
-- ============================================

CREATE TABLE IF NOT EXISTS families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid REFERENCES families(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  elder_name text NOT NULL,
  region text,
  language_spoken text,
  title text NOT NULL,
  audio_url text,
  video_url text,
  transcript text,
  translation text,
  summary text,
  tags text[] DEFAULT '{}',
  festival_date date,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- Step 2: Enable RLS on all tables
-- ============================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 3: families policies
-- ============================================

DROP POLICY IF EXISTS "select_own_family" ON families;
CREATE POLICY "select_own_family" ON families FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.family_id = families.id
      AND users.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_family" ON families;
CREATE POLICY "update_own_family" ON families FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.family_id = families.id
      AND users.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.family_id = families.id
      AND users.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_family" ON families;
CREATE POLICY "insert_family" ON families FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================
-- Step 4: users policies
-- ============================================

DROP POLICY IF EXISTS "select_users" ON users;
CREATE POLICY "select_users" ON users FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.family_id = users.family_id
    )
  );

DROP POLICY IF EXISTS "insert_own_user" ON users;
CREATE POLICY "insert_own_user" ON users FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "update_own_user" ON users;
CREATE POLICY "update_own_user" ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- Step 5: stories policies
-- ============================================

DROP POLICY IF EXISTS "select_family_stories" ON stories;
CREATE POLICY "select_family_stories" ON stories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.family_id = stories.family_id
    )
  );

DROP POLICY IF EXISTS "insert_family_stories" ON stories;
CREATE POLICY "insert_family_stories" ON stories FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.family_id = stories.family_id
    )
  );

DROP POLICY IF EXISTS "update_family_stories" ON stories;
CREATE POLICY "update_family_stories" ON stories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.family_id = stories.family_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.family_id = stories.family_id
    )
  );

DROP POLICY IF EXISTS "delete_family_stories" ON stories;
CREATE POLICY "delete_family_stories" ON stories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.family_id = stories.family_id
    )
  );

-- ============================================
-- Step 6: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_stories_family_id ON stories(family_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_tags ON stories USING GIN (tags);

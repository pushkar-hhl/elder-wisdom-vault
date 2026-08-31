/*
# Create story-media storage bucket

## Overview
Creates a public storage bucket for audio/video uploads and sets up RLS policies
so only authenticated users can upload, but anyone can read (public bucket).

## Changes
1. Create `story-media` bucket (public = true so files are publicly readable)
2. Add storage policies:
   - SELECT: anyone can read (public bucket)
   - INSERT: authenticated users can upload
   - UPDATE/DELETE: authenticated users can manage their own uploads
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('story-media', 'story-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Public read access on story-media" ON storage.objects;
CREATE POLICY "Public read access on story-media" ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'story-media');

-- Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated upload to story-media" ON storage.objects;
CREATE POLICY "Authenticated upload to story-media" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'story-media');

-- Authenticated users can update their own files
DROP POLICY IF EXISTS "Authenticated update on story-media" ON storage.objects;
CREATE POLICY "Authenticated update on story-media" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'story-media' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'story-media');

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "Authenticated delete on story-media" ON storage.objects;
CREATE POLICY "Authenticated delete on story-media" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'story-media' AND owner = auth.uid());

/*
# Create storage bucket for complaint images

1. Storage
- Create a public bucket named `complaint-images` for storing citizen-uploaded photos.
- Public bucket so images can be displayed via public URLs without signed URLs.
2. Security
- Allow anon + authenticated to upload, read, and delete objects in the bucket.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_complaint_images" ON storage.objects;
CREATE POLICY "anon_read_complaint_images" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'complaint-images');

DROP POLICY IF EXISTS "anon_insert_complaint_images" ON storage.objects;
CREATE POLICY "anon_insert_complaint_images" ON storage.objects FOR INSERT
  TO anon, authenticated WITH CHECK (bucket_id = 'complaint-images');

DROP POLICY IF EXISTS "anon_update_complaint_images" ON storage.objects;
CREATE POLICY "anon_update_complaint_images" ON storage.objects FOR UPDATE
  TO anon, authenticated USING (bucket_id = 'complaint-images') WITH CHECK (bucket_id = 'complaint-images');

DROP POLICY IF EXISTS "anon_delete_complaint_images" ON storage.objects;
CREATE POLICY "anon_delete_complaint_images" ON storage.objects FOR DELETE
  TO anon, authenticated USING (bucket_id = 'complaint-images');

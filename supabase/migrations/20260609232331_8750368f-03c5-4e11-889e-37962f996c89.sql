
CREATE POLICY "anyone_read_photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "anyone_insert_photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos');
CREATE POLICY "anyone_delete_photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos');


-- Add photo columns to bookings
ALTER TABLE public.bookings
ADD COLUMN customer_photo_url TEXT,
ADD COLUMN driver_photo_url TEXT;

-- Create storage bucket for shipment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipment-photos', 'shipment-photos', true);

-- Anyone can view shipment photos
CREATE POLICY "Shipment photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'shipment-photos');

-- Authenticated users can upload to their own folder
CREATE POLICY "Users can upload shipment photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shipment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own photos
CREATE POLICY "Users can update their own shipment photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shipment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own shipment photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shipment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

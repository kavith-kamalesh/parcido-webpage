-- Create driver_documents table
CREATE TABLE public.driver_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('cdl', 'rc', 'insurance', 'pollution', 'medical', 'fitness', 'profilePhoto')),
  file_url TEXT NOT NULL,
  expiry_date DATE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id, document_type)
);

-- Enable RLS
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view their own documents"
ON public.driver_documents FOR SELECT
TO authenticated
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert their own documents"
ON public.driver_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own documents"
ON public.driver_documents FOR UPDATE
TO authenticated
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own documents"
ON public.driver_documents FOR DELETE
TO authenticated
USING (auth.uid() = driver_id);

-- Add is_activated column to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_activated BOOLEAN DEFAULT FALSE;

-- Create storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage policies for driver documents
CREATE POLICY "Drivers can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Drivers can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
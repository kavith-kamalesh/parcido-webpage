-- Create profile_details table for extended profile information
CREATE TABLE IF NOT EXISTS profile_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone TEXT,
  experience_years INTEGER,
  languages TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE profile_details ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile details" ON profile_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile details" ON profile_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile details" ON profile_details
  FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profile_details_updated_at
  BEFORE UPDATE ON profile_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
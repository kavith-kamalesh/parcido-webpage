-- Create vehicles table for driver vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('truck', 'van', 'pickup', 'motorcycle', 'bicycle')),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  plate_number TEXT NOT NULL UNIQUE,
  capacity_m3 DOUBLE PRECISION,
  max_weight_kg DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT TRUE,
  documents_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view their own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can insert their own vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own vehicles" ON vehicles
  FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own vehicles" ON vehicles
  FOR DELETE USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all vehicles" ON vehicles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX idx_vehicles_is_active ON vehicles(is_active);
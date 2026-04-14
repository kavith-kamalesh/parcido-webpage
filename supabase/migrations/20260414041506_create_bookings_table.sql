-- Create bookings table for shipment bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_latitude DOUBLE PRECISION NOT NULL,
  pickup_longitude DOUBLE PRECISION NOT NULL,
  delivery_latitude DOUBLE PRECISION NOT NULL,
  delivery_longitude DOUBLE PRECISION NOT NULL,
  total_volume_m3 DOUBLE PRECISION,
  total_weight_kg DOUBLE PRECISION,
  goods_description TEXT,
  special_instructions TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'accepted', 'in_transit', 'completed', 'cancelled')),
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  scheduled_pickup TIMESTAMP WITH TIME ZONE,
  actual_pickup TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Customers can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Drivers can view bookings assigned to them" ON bookings
  FOR SELECT USING (auth.uid() = driver_id);

CREATE POLICY "Customers can insert their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Drivers can update bookings assigned to them" ON bookings
  FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_driver_id ON bookings(driver_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
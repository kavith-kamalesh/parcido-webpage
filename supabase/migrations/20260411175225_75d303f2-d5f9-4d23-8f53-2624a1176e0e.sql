
-- Vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL DEFAULT 'truck',
  plate_number TEXT NOT NULL,
  capacity_m3 NUMERIC NOT NULL DEFAULT 0,
  max_weight_kg NUMERIC NOT NULL DEFAULT 0,
  allowed_categories TEXT[] NOT NULL DEFAULT ARRAY['general'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own vehicles"
  ON public.vehicles FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can insert their own vehicles"
  ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can update their own vehicles"
  ON public.vehicles FOR UPDATE USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can delete their own vehicles"
  ON public.vehicles FOR DELETE USING (auth.uid() = driver_id);
-- Customers need to see active vehicles for matching
CREATE POLICY "Authenticated users can view active vehicles"
  ON public.vehicles FOR SELECT USING (is_active = true);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_volume_m3 NUMERIC NOT NULL DEFAULT 0,
  total_weight_kg NUMERIC NOT NULL DEFAULT 0,
  categories TEXT[] NOT NULL DEFAULT ARRAY['general'],
  special_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','matched','accepted','in_transit','delivered','cancelled')),
  price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their own bookings"
  ON public.bookings FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Drivers can view bookings assigned to them"
  ON public.bookings FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can update bookings assigned to them"
  ON public.bookings FOR UPDATE USING (auth.uid() = driver_id);

-- Matching function: find vehicles that fit the booking requirements
CREATE OR REPLACE FUNCTION public.find_matching_vehicles(
  p_volume NUMERIC,
  p_weight NUMERIC,
  p_categories TEXT[]
)
RETURNS TABLE (
  vehicle_id UUID,
  driver_id UUID,
  vehicle_type TEXT,
  plate_number TEXT,
  capacity_m3 NUMERIC,
  max_weight_kg NUMERIC,
  allowed_categories TEXT[],
  driver_name TEXT,
  driver_avatar TEXT,
  available_space NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    v.id AS vehicle_id,
    v.driver_id,
    v.vehicle_type,
    v.plate_number,
    v.capacity_m3,
    v.max_weight_kg,
    v.allowed_categories,
    p.display_name AS driver_name,
    p.avatar_url AS driver_avatar,
    v.capacity_m3 - COALESCE(
      (SELECT SUM(b.total_volume_m3)
       FROM public.bookings b
       WHERE b.vehicle_id = v.id AND b.status IN ('matched','accepted','in_transit')),
      0
    ) AS available_space
  FROM public.vehicles v
  JOIN public.profiles p ON p.user_id = v.driver_id
  WHERE v.is_active = true
    AND v.capacity_m3 - COALESCE(
      (SELECT SUM(b.total_volume_m3)
       FROM public.bookings b
       WHERE b.vehicle_id = v.id AND b.status IN ('matched','accepted','in_transit')),
      0
    ) >= p_volume
    AND v.max_weight_kg >= p_weight
    AND v.allowed_categories @> p_categories
  ORDER BY (v.capacity_m3 - COALESCE(
      (SELECT SUM(b.total_volume_m3)
       FROM public.bookings b
       WHERE b.vehicle_id = v.id AND b.status IN ('matched','accepted','in_transit')),
      0
    )) ASC
  LIMIT 10;
$$;

-- Timestamp triggers
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Add available_capacity_m3 column (driver-set limit, defaults to full capacity)
ALTER TABLE public.vehicles
ADD COLUMN available_capacity_m3 numeric NOT NULL DEFAULT 0;

-- Set existing vehicles' available_capacity to their full capacity
UPDATE public.vehicles SET available_capacity_m3 = capacity_m3;

-- Update matching function to use available_capacity_m3
CREATE OR REPLACE FUNCTION public.find_matching_vehicles(p_volume numeric, p_weight numeric, p_categories text[])
 RETURNS TABLE(vehicle_id uuid, driver_id uuid, vehicle_type text, plate_number text, capacity_m3 numeric, max_weight_kg numeric, allowed_categories text[], driver_name text, driver_avatar text, available_space numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
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
    v.available_capacity_m3 - COALESCE(
      (SELECT SUM(b.total_volume_m3)
       FROM public.bookings b
       WHERE b.vehicle_id = v.id AND b.status IN ('matched','accepted','in_transit')),
      0
    ) AS available_space
  FROM public.vehicles v
  JOIN public.profiles p ON p.user_id = v.driver_id
  WHERE v.is_active = true
    AND v.available_capacity_m3 - COALESCE(
      (SELECT SUM(b.total_volume_m3)
       FROM public.bookings b
       WHERE b.vehicle_id = v.id AND b.status IN ('matched','accepted','in_transit')),
      0
    ) >= p_volume
    AND v.max_weight_kg >= p_weight
    AND v.allowed_categories @> p_categories
  ORDER BY (v.available_capacity_m3 - COALESCE(
      (SELECT SUM(b.total_volume_m3)
       FROM public.bookings b
       WHERE b.vehicle_id = v.id AND b.status IN ('matched','accepted','in_transit')),
      0
    )) ASC
  LIMIT 10;
$$;

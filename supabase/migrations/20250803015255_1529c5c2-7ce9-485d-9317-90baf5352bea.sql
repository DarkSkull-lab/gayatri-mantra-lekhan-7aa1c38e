-- Fix the security warning by setting search_path
CREATE OR REPLACE FUNCTION public.update_last_active_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
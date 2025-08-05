-- Add custom content management for admin panel
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_message TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_theme JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create a global settings table for site-wide customizations
CREATE TABLE IF NOT EXISTS global_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on global_settings
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for global_settings (admin only access would be handled in application layer)
CREATE POLICY "Allow all operations on global_settings" 
ON global_settings 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_global_settings_updated_at
    BEFORE UPDATE ON global_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
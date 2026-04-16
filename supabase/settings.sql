-- ============================================
-- STORE SETTINGS - Ejecutar en SQL Editor de Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS store_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER store_settings_updated_at
  BEFORE UPDATE ON store_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (needed for store page)
CREATE POLICY "Settings are publicly readable"
  ON store_settings FOR SELECT
  USING (true);

-- Only authenticated users can update settings
CREATE POLICY "Authenticated users can manage settings"
  ON store_settings FOR ALL
  USING (auth.role() = 'authenticated');

-- Default settings
INSERT INTO store_settings (key, value) VALUES
  ('store_name', 'Super Ofertas'),
  ('welcome_title', 'Bienvenido a nuestra tienda'),
  ('welcome_subtitle', 'Los mejores productos al mejor precio. ¡Compra fácil por WhatsApp!'),
  ('footer_text', 'Compra segura por WhatsApp Business')
ON CONFLICT (key) DO NOTHING;

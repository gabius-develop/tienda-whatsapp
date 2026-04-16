-- ============================================
-- PROMOCIONES - Ejecutar en SQL Editor de Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_label VARCHAR(100),
  badge_color VARCHAR(50) DEFAULT 'green',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_sort_order ON promotions(sort_order);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promotions are publicly viewable when active"
  ON promotions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage promotions"
  ON promotions FOR ALL
  USING (auth.role() = 'authenticated');

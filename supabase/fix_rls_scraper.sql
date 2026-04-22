-- ============================================
-- FIX RLS: Habilitar Row Level Security en
-- tablas del scraper de precios
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- price_history
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read price history"
  ON price_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert price history"
  ON price_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete price history"
  ON price_history FOR DELETE
  USING (auth.role() = 'authenticated');

-- price_comparison
ALTER TABLE price_comparison ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read price comparison"
  ON price_comparison FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert price comparison"
  ON price_comparison FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete price comparison"
  ON price_comparison FOR DELETE
  USING (auth.role() = 'authenticated');

-- tracked_products
ALTER TABLE tracked_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tracked products"
  ON tracked_products FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- TABLAS DEL SCRAPER DE PRECIOS
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- Histórico de precios scrapeados
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  was_price DECIMAL(10,2),
  url TEXT,
  image TEXT,
  rating DECIMAL(3,1),
  reviews INTEGER,
  site VARCHAR(50) NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comparativa de precios (tendencia up/down)
CREATE TABLE IF NOT EXISTS price_comparison (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price_today DECIMAL(10,2) NOT NULL,
  was_price DECIMAL(10,2),
  trend VARCHAR(10),
  price_change DECIMAL(10,2),
  site VARCHAR(50) NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- URLs/categorías a scrapear
CREATE TABLE IF NOT EXISTS tracked_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  site VARCHAR(50) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vista: último precio registrado por producto (sin duplicados)
CREATE OR REPLACE VIEW competitor_latest AS
SELECT DISTINCT ON (item_id, site)
  id, item_id, name, price, was_price, url, image, rating, reviews, site, scraped_at
FROM price_history
ORDER BY item_id, site, scraped_at DESC;

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_price_history_site ON price_history(site);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped_at ON price_history(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_item_site ON price_history(item_id, site);

-- ============================================================
-- PROMOCIONES CON PRECIO + CARRITO BOT
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Agregar precio a promociones
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- 2. Modificar bot_cart_items para soportar tanto productos como promociones

-- Hacer product_id nullable (antes era NOT NULL)
ALTER TABLE bot_cart_items ALTER COLUMN product_id DROP NOT NULL;

-- Agregar columna para promociones
ALTER TABLE bot_cart_items ADD COLUMN IF NOT EXISTS promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE;

-- Campos desnormalizados para nombre y precio al momento de agregar
ALTER TABLE bot_cart_items ADD COLUMN IF NOT EXISTS item_name  TEXT;
ALTER TABLE bot_cart_items ADD COLUMN IF NOT EXISTS item_price DECIMAL(10,2);

-- Eliminar constraint único anterior (cubría solo (tenant_id, customer_phone, product_id))
ALTER TABLE bot_cart_items DROP CONSTRAINT IF EXISTS bot_cart_items_unique;

-- Nuevos índices únicos parciales
CREATE UNIQUE INDEX IF NOT EXISTS bot_cart_items_product_unique
  ON bot_cart_items (tenant_id, customer_phone, product_id)
  WHERE product_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bot_cart_items_promo_unique
  ON bot_cart_items (tenant_id, customer_phone, promotion_id)
  WHERE promotion_id IS NOT NULL;

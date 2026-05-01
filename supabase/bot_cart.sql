-- ============================================================
-- BOT CART — Carrito de compras dentro del chat de WhatsApp
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Tabla: ítems del carrito de bot por cliente
CREATE TABLE IF NOT EXISTS bot_cart_items (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_phone VARCHAR(50)  NOT NULL,
  product_id     UUID         NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity       INTEGER      NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT bot_cart_items_unique UNIQUE (tenant_id, customer_phone, product_id)
);

CREATE INDEX IF NOT EXISTS idx_bot_cart_tenant_phone
  ON bot_cart_items (tenant_id, customer_phone);

-- Columna de contexto en conversaciones (guarda estado intermedio del checkout)
ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}';

-- Modo restaurante en la config del bot
ALTER TABLE whatsapp_bot_config
  ADD COLUMN IF NOT EXISTS is_restaurant BOOLEAN NOT NULL DEFAULT false;

-- RLS: el bot usa service role, pero por buenas prácticas habilitamos la tabla
ALTER TABLE bot_cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role puede todo en bot_cart_items"
  ON bot_cart_items
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- WHATSAPP MESSAGES - Historial de conversaciones
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_phone TEXT        NOT NULL,
  direction      TEXT        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content        TEXT        NOT NULL,
  wa_message_id  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_phone
  ON whatsapp_messages(tenant_id, customer_phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_created
  ON whatsapp_messages(tenant_id, created_at DESC);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can manage whatsapp_messages"
  ON whatsapp_messages FOR ALL
  USING (auth.role() = 'authenticated');

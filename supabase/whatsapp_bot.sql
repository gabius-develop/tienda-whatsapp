-- ============================================================
-- WHATSAPP BOT - Migración
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Configuración del bot por tenant
CREATE TABLE IF NOT EXISTS whatsapp_bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Credenciales de WhatsApp Business Cloud API (Meta)
  phone_number_id TEXT NOT NULL DEFAULT '',   -- Phone Number ID del panel de Meta
  access_token    TEXT NOT NULL DEFAULT '',   -- Token de acceso de larga duración
  verify_token    TEXT NOT NULL DEFAULT '',   -- Token de verificación del webhook (tú lo eliges)

  is_active BOOLEAN NOT NULL DEFAULT false,

  -- Mensajes configurables del bot
  welcome_message    TEXT NOT NULL DEFAULT '¡Hola! 👋 Bienvenido a nuestra tienda. ¿En qué te puedo ayudar?',
  menu_header        TEXT NOT NULL DEFAULT '¿Qué deseas hacer?',
  orders_ask_phone   TEXT NOT NULL DEFAULT 'Por favor, ingresa el número de teléfono que usaste al hacer tu pedido (solo los dígitos):',
  support_message    TEXT NOT NULL DEFAULT '¡Gracias por contactarnos! 🙏 Un agente te atenderá en breve. Para una respuesta más rápida puedes escribirnos directamente.',
  no_orders_message  TEXT NOT NULL DEFAULT 'No encontramos pedidos con ese número. Verifica que sea el número correcto o intenta con otro.',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER whatsapp_bot_config_updated_at
  BEFORE UPDATE ON whatsapp_bot_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2. Estado de conversaciones activas
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  -- Estado de la conversación: idle | order_lookup
  state          TEXT NOT NULL DEFAULT 'idle',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, customer_phone)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_bot_config_tenant_id   ON whatsapp_bot_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_bot_config_phone_num_id ON whatsapp_bot_config(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_tenant    ON whatsapp_conversations(tenant_id, customer_phone);

-- RLS: solo service_role puede leer/escribir (el bot usa SUPABASE_SERVICE_ROLE_KEY)
ALTER TABLE whatsapp_bot_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Admins autenticados pueden leer y editar su propia config
CREATE POLICY "Auth users can manage whatsapp_bot_config"
  ON whatsapp_bot_config FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth users can manage whatsapp_conversations"
  ON whatsapp_conversations FOR ALL
  USING (auth.role() = 'authenticated');

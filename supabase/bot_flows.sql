-- ============================================================
-- BOT FLOWS — Flujos personalizados + imagen de bienvenida
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Agregar welcome_image_url a la config del bot
ALTER TABLE whatsapp_bot_config
  ADD COLUMN IF NOT EXISTS welcome_image_url TEXT;

-- 2. Tabla de flujos / pasos del menú interactivo
CREATE TABLE IF NOT EXISTS bot_flow_steps (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES bot_flow_steps(id) ON DELETE CASCADE,

  -- ID que WhatsApp usa para identificar el botón cuando el usuario lo toca
  button_id    TEXT NOT NULL,
  -- Texto visible en el botón (máx 20 chars en WhatsApp)
  button_title TEXT NOT NULL,

  -- 'products' | 'orders' | 'support' | 'custom'
  step_type TEXT NOT NULL DEFAULT 'custom',

  -- Solo aplica para step_type = 'custom'
  response_text      TEXT,
  response_image_url TEXT,

  sort_order INTEGER     NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_flow_steps_tenant
  ON bot_flow_steps(tenant_id);

CREATE INDEX IF NOT EXISTS idx_bot_flow_steps_parent
  ON bot_flow_steps(parent_id);

CREATE INDEX IF NOT EXISTS idx_bot_flow_steps_button_id
  ON bot_flow_steps(tenant_id, button_id);

ALTER TABLE bot_flow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can manage bot_flow_steps"
  ON bot_flow_steps FOR ALL
  USING (auth.role() = 'authenticated');

CREATE OR REPLACE TRIGGER bot_flow_steps_updated_at
  BEFORE UPDATE ON bot_flow_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

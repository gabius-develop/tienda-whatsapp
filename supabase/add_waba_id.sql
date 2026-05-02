-- ============================================================
-- WABA ID para plantillas de Meta
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Agregar columna waba_id a la config del bot (para cargar plantillas desde Meta)
ALTER TABLE whatsapp_bot_config ADD COLUMN IF NOT EXISTS waba_id TEXT;

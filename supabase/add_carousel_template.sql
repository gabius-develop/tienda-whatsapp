-- ============================================================
-- CAROUSEL TEMPLATE - Migración
-- Agrega soporte para enviar productos como carousel de WhatsApp
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Nombre del template carousel aprobado en Meta Business Manager
ALTER TABLE whatsapp_bot_config
  ADD COLUMN IF NOT EXISTS carousel_template_name TEXT DEFAULT NULL;

-- Idioma del template (ej: 'es', 'es_MX', 'en_US')
ALTER TABLE whatsapp_bot_config
  ADD COLUMN IF NOT EXISTS carousel_template_lang TEXT DEFAULT 'es';

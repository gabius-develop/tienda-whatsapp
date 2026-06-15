-- ============================================================
-- MIGRACIÓN: Agregar columnas media_url y media_type
-- a whatsapp_messages para soporte de imágenes
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS media_url  TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT;

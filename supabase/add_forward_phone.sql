-- Migración: agrega columna forward_phone a whatsapp_bot_config
-- Permite reenviar automáticamente todos los mensajes entrantes del bot
-- a un número de WhatsApp configurable por el administrador.

ALTER TABLE whatsapp_bot_config
  ADD COLUMN IF NOT EXISTS forward_phone text;

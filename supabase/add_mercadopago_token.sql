-- Agregar token de MercadoPago por tenant
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT;

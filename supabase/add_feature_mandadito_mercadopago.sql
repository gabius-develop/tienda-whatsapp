-- Agregar flags de funcionalidades: bot de mandaditos y pago con MercadoPago
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS feature_mandadito  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_mercadopago BOOLEAN NOT NULL DEFAULT false;

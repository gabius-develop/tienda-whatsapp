-- ============================================
-- MULTI-TENANCY MIGRATION
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- 1. Tabla de tenants (clientes)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,           -- se usa como subdominio: slug.tudominio.com
  whatsapp_phone TEXT,                 -- número WhatsApp del cliente (con código de país, sin +)
  feature_live BOOLEAN NOT NULL DEFAULT false,
  feature_competencia BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  admin_email TEXT,                    -- email del admin de esta tienda
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at en tenants
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Tenant por defecto para datos existentes
INSERT INTO tenants (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default', 'default', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Agregar tenant_id a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE products SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;

-- 3. Agregar tenant_id a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE orders SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE orders ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Agregar tenant_id a order_items (para stats eficientes)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE order_items oi
  SET tenant_id = o.tenant_id
  FROM orders o
  WHERE oi.order_id = o.id AND oi.tenant_id IS NULL;
ALTER TABLE order_items ALTER COLUMN tenant_id SET NOT NULL;

-- 5. Agregar tenant_id a promotions
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE promotions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE promotions ALTER COLUMN tenant_id SET NOT NULL;

-- 6. Migrar store_settings: cambiar PK de (key) a (key, tenant_id)
ALTER TABLE store_settings DROP CONSTRAINT IF EXISTS store_settings_pkey;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE store_settings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE store_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE store_settings ADD PRIMARY KEY (key, tenant_id);

-- 7. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant_id ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_tenant_id ON promotions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_settings_tenant_id ON store_settings(tenant_id);

-- 8. RLS para tenants (lectura pública para lookup por slug)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants are publicly readable"
  ON tenants FOR SELECT
  USING (is_active = true);

-- Solo service_role puede crear/editar tenants (superadmin API usa service_role_key)
-- No creamos políticas de INSERT/UPDATE/DELETE para que solo service_role pueda hacerlo

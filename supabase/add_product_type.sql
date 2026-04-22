-- Add product_type and attributes columns to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS attributes JSONB NOT NULL DEFAULT '{}';

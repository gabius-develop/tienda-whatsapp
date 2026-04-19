-- Migración: agregar precio anterior a productos
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS was_price DECIMAL(10,2) DEFAULT NULL;

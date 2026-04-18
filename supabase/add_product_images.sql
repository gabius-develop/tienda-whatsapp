-- Migración: agregar columna images a la tabla products
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT NULL;

-- Backfill: si un producto ya tiene image_url, lo copiamos al array
UPDATE products
  SET images = ARRAY[image_url]
  WHERE image_url IS NOT NULL AND images IS NULL;

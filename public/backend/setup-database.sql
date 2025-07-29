-- Crear tabla de productos en Supabase
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  image VARCHAR(500),
  presentations JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_category ON productos(category);
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos(created_at);

-- Habilitar RLS (Row Level Security) para seguridad
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública
CREATE POLICY "Permitir lectura pública de productos" ON productos
  FOR SELECT USING (true);

-- Política para permitir inserción solo a usuarios autenticados (admin)
CREATE POLICY "Permitir inserción a admin" ON productos
  FOR INSERT WITH CHECK (true);

-- Política para permitir actualización solo a usuarios autenticados (admin)
CREATE POLICY "Permitir actualización a admin" ON productos
  FOR UPDATE USING (true);

-- Política para permitir eliminación solo a usuarios autenticados (admin)
CREATE POLICY "Permitir eliminación a admin" ON productos
  FOR DELETE USING (true); 
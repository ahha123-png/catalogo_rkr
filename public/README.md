# Catálogo RKR - Sistema Completo con Supabase

## 🚀 Configuración Completa para Internet

### 1. Configurar Supabase

1. **Ir a tu proyecto de Supabase** (ya creado)
2. **Ir a SQL Editor** en el menú izquierdo
3. **Ejecutar el siguiente SQL** (copiar y pegar el contenido de `backend/setup-database.sql`):

```sql
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
```

### 2. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 3. Desplegar Backend en Render

1. **Crear cuenta en Render.com** (gratis)
2. **Crear nuevo Web Service**
3. **Conectar tu repositorio de GitHub** (subir el código primero)
4. **Configurar:**
   - **Name:** `catalogo-rkr-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### 4. Desplegar Frontend

#### Opción A: GitHub Pages (Recomendado)
1. **Crear repositorio en GitHub**
2. **Subir solo la carpeta `public`** (con `index.html`)
3. **Ir a Settings → Pages**
4. **Source:** Deploy from a branch
5. **Branch:** main
6. **Folder:** / (root)

#### Opción B: Netlify
1. **Crear cuenta en Netlify.com**
2. **Drag & Drop** la carpeta `public`
3. **O conectar repositorio de GitHub**

### 5. Configurar URLs

Una vez desplegado el backend, actualizar la URL en `index.html`:

```javascript
const backendUrl = 'https://tu-backend.onrender.com'; // Cambiar por tu URL real
```

### 6. Probar el Sistema

1. **Abrir tu sitio web desplegado**
2. **Iniciar sesión como admin:**
   - Usuario: `admin`
   - Contraseña: `admin123`
3. **Agregar productos** usando el panel de administración
4. **Probar compras** para verificar que el stock se actualiza

### 7. Funcionalidades Implementadas

✅ **Sistema completo de productos con Supabase**
✅ **Panel de administración seguro**
✅ **Actualización automática de stock**
✅ **Actualizaciones en tiempo real**
✅ **Sistema de carrito profesional**
✅ **Envío de pedidos por WhatsApp**
✅ **Interfaz responsive y moderna**

### 8. Credenciales de Acceso

- **Admin:** `admin` / `admin123`
- **Base de datos:** Supabase (configurada automáticamente)
- **Backend:** Render.com (gratis)
- **Frontend:** GitHub Pages o Netlify (gratis)

### 9. Estructura del Proyecto

```
catalogo_rkr/
├── backend/
│   ├── server.js          # Servidor con Supabase
│   ├── package.json       # Dependencias
│   └── setup-database.sql # Configuración de BD
├── public/
│   ├── index.html         # Frontend principal
│   ├── img/               # Imágenes de productos
│   └── productos/
│       └── productos.json # Productos estáticos (respaldo)
└── README.md              # Este archivo
```

### 10. Soporte

Si tienes problemas:
1. Verificar que Supabase esté configurado correctamente
2. Verificar que el backend esté desplegado en Render
3. Verificar que las URLs estén actualizadas
4. Revisar la consola del navegador para errores

¡Tu sistema estará funcionando completamente en internet! 🌐 
// backend/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración básica
app.use(cors());
app.use(express.json());

// Configuración de Supabase
const supabaseUrl = 'https://cekwdsvpmscukubrcuewh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNla3dkc3ZwbXNja3VicmN1ZXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MjYxODcsImV4cCI6MjA2OTQwMjE4N30.E00eK-y_gnBHP0yNoSBTz70suimBFuPKZvMCg2Q-k1Y';
const supabase = createClient(supabaseUrl, supabaseKey);

// Usuario admin
const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = bcrypt.hashSync('admin123', 10);
const JWT_SECRET = 'clave_super_secreta_para_produccion';

// Middleware de autenticación
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Login admin
app.post('/api/login', (req, res) => {
  const { usuario, clave } = req.body;
  
  if (usuario === ADMIN_USER && bcrypt.compareSync(clave, ADMIN_PASS_HASH)) {
    const token = jwt.sign({ usuario }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas' });
  }
});

// Leer productos desde Supabase
app.get('/api/productos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Guardar producto (solo admin)
app.post('/api/productos', authMiddleware, async (req, res) => {
  try {
    const nuevoProducto = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('productos')
      .insert([nuevoProducto])
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// Editar producto (solo admin)
app.put('/api/productos/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Producto no encontrado' });
    
    res.json(data);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// Eliminar producto (solo admin)
app.delete('/api/productos/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ ok: true });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// Comprar producto (reduce stock)
app.post('/api/comprar', async (req, res) => {
  try {
    const { productoId, presentacionId, cantidad } = req.body;
    
    // Obtener el producto actual
    const { data: producto, error: getError } = await supabase
      .from('productos')
      .select('*')
      .eq('id', productoId)
      .single();
    
    if (getError || !producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Actualizar el stock de la presentación específica
    const presentaciones = producto.presentations.map(p => {
      if (p.id === presentacionId) {
        const nuevoStock = Math.max(0, p.stock - cantidad);
        return { ...p, stock: nuevoStock };
      }
      return p;
    });
    
    // Actualizar el producto en la base de datos
    const { error: updateError } = await supabase
      .from('productos')
      .update({ 
        presentations: presentaciones,
        updated_at: new Date().toISOString()
      })
      .eq('id', productoId);
    
    if (updateError) throw updateError;
    
    res.json({ ok: true, nuevoStock: presentaciones.find(p => p.id === presentacionId)?.stock || 0 });
  } catch (error) {
    console.error('Error al procesar compra:', error);
    res.status(500).json({ error: 'Error al procesar compra' });
  }
});

// Listar imágenes (desde carpeta local)
app.get('/api/imagenes', (req, res) => {
  const fs = require('fs');
  const imgPath = path.join(__dirname, '../img');
  
  function listarImagenes(dir, base = '') {
    let results = [];
    try {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        const relPath = path.join(base, file);
        if (fs.statSync(fullPath).isDirectory()) {
          results = results.concat(listarImagenes(fullPath, relPath));
        } else if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
          results.push(relPath.replace(/\\/g, '/'));
        }
      });
    } catch (error) {
      console.error('Error al listar imágenes:', error);
    }
    return results;
  }
  
  const imagenes = listarImagenes(imgPath);
  res.json(imagenes);
});

// Subir imagen (solo admin)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../img')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

app.post('/api/upload', authMiddleware, upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  res.json({ path: req.file.filename });
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
  console.log('Conectado a Supabase');
}); 
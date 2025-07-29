// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Configuración básica
app.use(cors());
app.use(express.json());

// Rutas de carpetas
const PRODUCTOS_PATH = path.join(__dirname, '../public/productos');
const IMG_PATH = path.join(__dirname, '../public/img');

// Usuario admin (puedes cambiar la clave)
const ADMIN_USER = 'admin';
const ADMIN_PASS_HASH = bcrypt.hashSync('admin123', 10); // Cambia 'admin123' por tu clave segura
const JWT_SECRET = 'clave_super_secreta'; // Cambia esto por una clave fuerte

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
    const token = jwt.sign({ usuario }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas' });
  }
});

// Leer productos
app.get('/api/productos', (req, res) => {
  const file = path.join(PRODUCTOS_PATH, 'productos.json');
  if (!fs.existsSync(file)) return res.json([]);
  const productos = JSON.parse(fs.readFileSync(file, 'utf8'));
  res.json(productos);
});

// Guardar productos (solo admin)
app.post('/api/productos', authMiddleware, (req, res) => {
  const file = path.join(PRODUCTOS_PATH, 'productos.json');
  let productos = [];
  if (fs.existsSync(file)) productos = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nuevo = req.body;
  nuevo.id = Date.now().toString();
  productos.push(nuevo);
  fs.writeFileSync(file, JSON.stringify(productos, null, 2));
  res.json(nuevo);
});

// Editar producto (solo admin)
app.put('/api/productos/:id', authMiddleware, (req, res) => {
  const file = path.join(PRODUCTOS_PATH, 'productos.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'No existe' });
  let productos = JSON.parse(fs.readFileSync(file, 'utf8'));
  const idx = productos.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'No existe' });
  productos[idx] = { ...productos[idx], ...req.body };
  fs.writeFileSync(file, JSON.stringify(productos, null, 2));
  res.json(productos[idx]);
});

// Eliminar producto (solo admin)
app.delete('/api/productos/:id', authMiddleware, (req, res) => {
  const file = path.join(PRODUCTOS_PATH, 'productos.json');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'No existe' });
  let productos = JSON.parse(fs.readFileSync(file, 'utf8'));
  productos = productos.filter(p => p.id !== req.params.id);
  fs.writeFileSync(file, JSON.stringify(productos, null, 2));
  res.json({ ok: true });
});

// Listar imágenes (recursivo)
function listarImagenes(dir, base = '') {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.join(base, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(listarImagenes(fullPath, relPath));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
      results.push(relPath.replace(/\\/g, '/'));
    }
  });
  return results;
}

app.get('/api/imagenes', (req, res) => {
  const imagenes = listarImagenes(IMG_PATH);
  res.json(imagenes);
});

// Subir imagen (solo admin)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMG_PATH),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload', authMiddleware, upload.single('imagen'), (req, res) => {
  res.json({ path: req.file.filename });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});
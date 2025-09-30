// app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database (will retry internally); we await inside a bootstrap function below
// connectDB(); (moved)

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
console.log('[bootstrap] Middlewares base cargados');

// Rutas API principales
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));


// Configuración de EJS
const path = require('path');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


// Middleware de autenticación
const ensureAuthenticated = require('./middleware/auth');

// No-cache para rutas protegidas (colocado antes de definición de rutas protegidas)
app.use((req, res, next) => {
  if (req.path.startsWith('/dashboard') || req.path.startsWith('/ciclos') || req.path.startsWith('/catalogo') || req.path.startsWith('/gestionfinca') ) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});


// Página de inicio
app.get('/', (req, res) => {
  var token = null;
  if (req.cookies && req.cookies.token) token = req.cookies.token;
  if (token) {
    const jwt = require('jsonwebtoken');
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      return res.redirect('/dashboard');
    } catch (err) {
      // Token inválido o expirado, mostrar index
    }
  }
  res.render('index');
});

// Ruta de estado de salud /health (útil para ngrok / monitoreo)
app.get('/health', (req,res)=>{
  res.json({ ok:true, time: Date.now() });
});

// Rutas de autenticación vistas
app.use('/auth', require('./routes/auth'));

// Exponer branding en plantillas
app.locals.brand = {
  nombre: 'DataXion',
  slogan: 'Cultivando decisiones inteligentes',
  colorPrimario: '#1B4DFF',
  colorSecundario: '#0A2A6B',
  colorAcento: '#3CCB7F'
};




// Rutas protegidas
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  // Debug registro de query
  if (req.query && Object.keys(req.query).length) {
    console.log('[debug] Dashboard query params:', req.query);
  }
  res.render('dashboard', { user: req.user || null });
});

// Asegurar que al hacer logout no se pueda volver con back cacheado

app.use('/gestionfinca', require('./routes/gestionfinca'));
app.use('/catalogo', require('./routes/catalogo'));
// API catálogo agrícola CRUD
app.use('/api/catalogo', require('./routes/catalogoApi'));
// Branding / identidad visual
app.use('/branding', require('./routes/branding'));
// Ciclos de cultivo (vista + API)
app.use('/ciclos', require('./routes/ciclos'));
app.use('/api/ciclos', require('./routes/ciclosApi'));
app.use('/api/cultivos', require('./routes/cultivosApi'));
// API hitos de ciclos
app.use('/api', require('./routes/ciclosHitosApi'));

// Cerrar sesión
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

async function bootstrap(){
  console.log('[bootstrap] Starting DataXion server...');
  try {
    await connectDB();
    console.log('[bootstrap] DB init step finished (may still be disconnected if retries exhausted).');
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    server.on('error', (err)=>{
      console.error('[bootstrap] HTTP server error:', err);
      process.exit(1);
    });
  } catch(e){
    console.error('[bootstrap] Fatal during startup:', e);
    process.exit(1);
  }
}

bootstrap();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Middleware de manejo de errores al final
app.use((err, req, res, next) => {
  console.error('[express-error] ', err.stack || err);
  if (res.headersSent) return next(err);
  try {
    res.status(500).send('Error interno del servidor');
  } catch(_) {
    // ignore
  }
});
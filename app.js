// app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));


// ✅ Essential middleware to parse JSON
app.use(express.json());

// ✅ Import and use your auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes); // Correctly mounts routes under /api/auth


// Configuración de EJS
const path = require('path');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


// Middleware de autenticación
const ensureAuthenticated = require('./middleware/auth');


// Página de inicio
app.get('/', (req, res) => {
  const token = req.cookies?.token;
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

// Usar rutas /auth/login y /auth/register desde routes/auth.js
app.use('/auth', require('./routes/auth'));




// Rutas protegidas
app.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user || null });
});

app.use('/gestionfinca', require('./routes/gestionfinca'));
app.use('/catalogo', require('./routes/catalogo'));

// Cerrar sesión
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
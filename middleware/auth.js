// middleware/auth.js
const jwt = require('jsonwebtoken');

function ensureAuthenticated(req, res, next) {
  // Leer token desde cookie o cabecera
  const token = req.cookies?.token || (req.headers['authorization']?.split(' ')[1]);
  if (!token) {
    return res.status(401).render('login', { error: 'Acceso denegado. Debes iniciar sesión para acceder a esta página.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    // Evitar cache del contenido autenticado
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  } catch (err) {
    return res.status(401).render('login', { error: 'Token inválido o expirado. Por favor inicia sesión nuevamente.' });
  }
}

module.exports = ensureAuthenticated;

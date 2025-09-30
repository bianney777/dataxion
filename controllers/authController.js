// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../modules/mailer');

const authController = {
  async register(req,res){
    try {
      const { id_rol, nombre, apellido, email, contrasena, contrasena_confirm, telefono, direccion } = req.body;
      const normEmail = (email || '').trim().toLowerCase();
      // Validaciones básicas
      const errors = [];
      if(!normEmail) errors.push('El correo es obligatorio.');
      else if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normEmail)) errors.push('Formato de correo inválido.');
      if(!contrasena) errors.push('La contraseña es obligatoria.');
      if(contrasena && contrasena.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres.');
      if(contrasena && !/[A-ZÁÉÍÓÚ]/.test(contrasena)) errors.push('Incluye al menos una letra mayúscula.');
      if(contrasena && !/[a-záéíóú]/.test(contrasena)) errors.push('Incluye al menos una letra minúscula.');
      if(contrasena && !/[0-9]/.test(contrasena)) errors.push('Incluye al menos un número.');
      if(contrasena && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(contrasena)) errors.push('Incluye al menos un símbolo.');
      if(contrasena && contrasena_confirm && contrasena !== contrasena_confirm) errors.push('Las contraseñas no coinciden.');
      if(errors.length){
        return res.status(400).render('register', { error: errors.join(' ') });
      }
      const existing = await User.findByEmail(normEmail);
      if(existing){
        return res.status(400).render('register', { error: 'El usuario ya existe.' });
      }
  const created = await User.create({ id_rol, nombre, apellido, email: normEmail, contrasena, telefono, direccion });
  // Activación inmediata: no se envía correo de verificación
      const tokenJWT = jwt.sign({ id: created.id, role: id_rol || 2 }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
      res.cookie('token', tokenJWT, { httpOnly: true });
  return res.redirect('/dashboard?welcome=1');
    } catch(e){
      res.status(500).json({ ok:false, message:'Error del servidor', error: e.message });
    }
  },
  async verify(req,res){
    try {
      const code = (req.query.code || req.body.code || '').trim();
      // Verificación ya no necesaria
      return res.redirect('/dashboard');
    } catch(e){ res.status(500).send('Error verificando cuenta'); }
  },
  async verifyCodeApi(req,res){
    try {
      const { code } = req.body || {};
  return res.status(400).json({ ok:false, message:'La verificación por código está deshabilitada' });
    } catch(e){
      console.error('[verifyCodeApi] error', e);
      res.status(500).json({ ok:false, message:'Error interno' });
    }
  },
  async login(req,res){
    try {
      const { email, contrasena } = req.body;
      const user = await User.findByEmail(email);
      if(!user) return res.status(400).render('login', { error: 'Credenciales inválidas (usuario no encontrado)' });
      if(user.estado === 'inactivo') return res.status(403).render('login', { error: 'Tu cuenta está inactiva. Contacta soporte.' });
      const passOk = await bcrypt.compare(contrasena, user.contrasena);
      if(!passOk) return res.status(400).render('login', { error: 'Contraseña incorrecta.' });
      await User.updateLastAccess(user.id_usuario);
      const token = jwt.sign({ id: user.id_usuario, role: user.id_rol }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
      res.cookie('token', token, { httpOnly: true });
      // Si pendiente, dashboard mostrará aviso si lee query param (podemos agregar banner allí)
      res.redirect('/dashboard' + (user.estado === 'pendiente' ? '?pending=1' : ''));
    } catch(e){
      res.status(500).render('login', { error: 'Error interno del servidor.' });
    }
  }
};

module.exports = authController;
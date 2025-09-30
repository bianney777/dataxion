// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authController = {
  async register(req, res) {
    try {
      const { id_rol, nombre, apellido, email, contrasena, telefono, direccion } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'El usuario ya existe' });
      }

      // Create new user
      const userId = await User.create({
        id_rol, nombre, apellido, email, contrasena, telefono, direccion
      });

      res.status(201).json({ 
        message: 'Usuario registrado exitosamente', 
        userId 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, contrasena } = req.body;
      
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(contrasena, user.contrasena);
      if (!isMatch) {
        return res.status(400).json({ message: 'Credenciales inválidas' });
      }

      // Create and assign JWT token
      const token = jwt.sign(
        { id: user.id_usuario, role: user.id_rol }, 
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
      );

      res.cookie('token', token, { httpOnly: true });
      res.redirect('/dashboard');
    } catch (error) {
      res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
  }
};

module.exports = authController;
// models/User.js
const { getConnection } = require('../config/db');
const bcrypt = require('bcrypt');

const User = {
  async create(userData) {
    const { id_rol, nombre, apellido, email, contrasena, telefono, direccion } = userData;
    
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    
    const query = `
      INSERT INTO usuarios (id_rol, nombre, apellido, email, contrasena, telefono, direccion, estado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')
    `;
    
    const [result] = await getConnection().execute(query, [
      id_rol, nombre, apellido, email, hashedPassword, telefono, direccion
    ]);
    
    return result.insertId;
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    const [rows] = await getConnection().execute(query, [email]);
    return rows[0];
  }
};

module.exports = User;
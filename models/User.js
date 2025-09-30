// models/User.js
const { getConnection } = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = {
  async create(userData) {
    const { id_rol, nombre, apellido, email, contrasena, telefono, direccion } = userData;
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const tokenVerificacion = crypto.randomBytes(24).toString('hex');
    // Reescribimos el INSERT usando placeholders para TODAS las columnas (estado se manda como valor) evitando desajustes.
    const q = `INSERT INTO usuarios (
        id_rol,
        nombre,
        apellido,
        email,
        contrasena,
        telefono,
        direccion,
        estado,
        token_verificacion,
        ultimo_acceso,
        creado_en,
        actualizado_en
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
    const now = new Date();
    const params = [
  id_rol || 2,
      nombre || '',
      apellido || '',
      email,
      hashedPassword,
      telefono || null,
      direccion || null,
      'pendiente',
      tokenVerificacion,
      null, // ultimo_acceso inicial null
      now,
      now
    ];
    // Debug opcional (descomentar si aún hay problemas)
    // console.log('[User.create] columns=12 paramsLength=', params.length, params);
    const [result] = await getConnection().execute(q, params);
    return { id: result.insertId, tokenVerificacion };
  },
  async findByEmail(email){
    const [rows] = await getConnection().execute('SELECT * FROM usuarios WHERE email=? LIMIT 1',[email]);
    return rows[0];
  },
  async findById(id){
    const [rows] = await getConnection().execute('SELECT * FROM usuarios WHERE id_usuario=? LIMIT 1',[id]);
    return rows[0];
  },
  async verifyAccount(token){
    const [rows] = await getConnection().execute('SELECT id_usuario, id_rol FROM usuarios WHERE token_verificacion=? AND estado="pendiente" LIMIT 1',[token]);
    if(!rows.length) return null;
    const { id_usuario, id_rol } = rows[0];
    await getConnection().execute('UPDATE usuarios SET estado="activo", token_verificacion=NULL, actualizado_en=NOW() WHERE id_usuario=?',[id_usuario]);
    return { id: id_usuario, role: id_rol };
  },
  async updateLastAccess(id){
    await getConnection().execute('UPDATE usuarios SET ultimo_acceso=NOW(), actualizado_en=NOW() WHERE id_usuario=?',[id]);
  }
};

module.exports = User;
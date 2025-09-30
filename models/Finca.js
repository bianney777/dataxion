// models/Finca.js
const { getConnection } = require('../config/db');

const Finca = {
  async findAllByUser(id_usuario) {
    const [rows] = await getConnection().execute('SELECT * FROM fincas WHERE id_usuario = ?', [id_usuario]);
    return rows;
  },
  async findById(id_finca) {
    const [rows] = await getConnection().execute('SELECT * FROM fincas WHERE id_finca = ?', [id_finca]);
    return rows[0];
  },
  async create(data) {
    const query = `INSERT INTO fincas (id_usuario, id_zona, nombre_finca, ubicacion, area_total, latitud, longitud, altitud, descripcion, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [data.id_usuario, data.id_zona, data.nombre_finca, data.ubicacion, data.area_total, data.latitud, data.longitud, data.altitud, data.descripcion, data.estado || 'activa'];
    const [result] = await getConnection().execute(query, params);
    return result.insertId;
  },
  async update(id_finca, data) {
    const query = `UPDATE fincas SET id_zona=?, nombre_finca=?, ubicacion=?, area_total=?, latitud=?, longitud=?, altitud=?, descripcion=?, estado=? WHERE id_finca=?`;
    const params = [data.id_zona, data.nombre_finca, data.ubicacion, data.area_total, data.latitud, data.longitud, data.altitud, data.descripcion, data.estado, id_finca];
    await getConnection().execute(query, params);
  },
  async delete(id_finca) {
    await getConnection().execute('DELETE FROM fincas WHERE id_finca = ?', [id_finca]);
  }
};

module.exports = Finca;

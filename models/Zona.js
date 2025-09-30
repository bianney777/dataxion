// models/Zona.js
const { getConnection } = require('../config/db');

const Zona = {
  async findAll() {
    try {
      const [rows] = await getConnection().execute('SELECT id_zona, nombre_zona, pais, region, provincia, distrito, codigo_postal FROM zonas_geograficas ORDER BY nombre_zona ASC');
      return rows;
    } catch (e) {
      console.error('[Zona.findAll] error:', e.message);
      return [];
    }
  },
  async findById(id_zona){
    const [rows] = await getConnection().execute('SELECT id_zona, nombre_zona, pais, region, provincia, distrito, codigo_postal FROM zonas_geograficas WHERE id_zona=?',[id_zona]);
    return rows[0];
  }
};

module.exports = Zona;
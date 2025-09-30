// models/VariedadCultivo.js
const { getConnection } = require('../config/db');

const VariedadCultivo = {
  async findByTipo(id_tipo_cultivo){
    const [rows] = await getConnection().execute('SELECT * FROM variedades_cultivo WHERE id_tipo_cultivo=? ORDER BY nombre_variedad',[id_tipo_cultivo]);
    return rows;
  }
};

module.exports = VariedadCultivo;

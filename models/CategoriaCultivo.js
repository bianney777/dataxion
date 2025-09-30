// models/CategoriaCultivo.js
const { getConnection } = require('../config/db');

const CategoriaCultivo = {
  async findAll(){
    const [rows] = await getConnection().execute('SELECT * FROM categorias_cultivo ORDER BY nombre_categoria ASC');
    return rows;
  },
  async findById(id){
    const [rows] = await getConnection().execute('SELECT * FROM categorias_cultivo WHERE id_categoria=?',[id]);
    return rows[0];
  }
};

module.exports = CategoriaCultivo;

// models/CategoriaInsumo.js
const { getConnection } = require('../config/db');

const CategoriaInsumo = {
  async findAll(){
    const [rows] = await getConnection().execute('SELECT * FROM categorias_insumos ORDER BY nombre_categoria ASC');
    return rows;
  },
  async findById(id){
    const [rows] = await getConnection().execute('SELECT * FROM categorias_insumos WHERE id_categoria_insumo=?',[id]);
    return rows[0];
  }
};

module.exports = CategoriaInsumo;

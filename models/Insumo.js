// models/Insumo.js
const { getConnection } = require('../config/db');

const Insumo = {
  async findAll(){
    const [rows] = await getConnection().execute(`SELECT i.*, ci.nombre_categoria, ci.tipo 
      FROM insumos i INNER JOIN categorias_insumos ci ON ci.id_categoria_insumo=i.id_categoria_insumo 
      ORDER BY ci.nombre_categoria, i.nombre_insumo`);
    return rows;
  },
  async findByCategoria(id_categoria_insumo){
    const [rows] = await getConnection().execute('SELECT * FROM insumos WHERE id_categoria_insumo=? ORDER BY nombre_insumo',[id_categoria_insumo]);
    return rows;
  }
};

module.exports = Insumo;

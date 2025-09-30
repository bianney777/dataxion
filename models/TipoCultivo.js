// models/TipoCultivo.js
const { getConnection } = require('../config/db');

const TipoCultivo = {
  async findAll(){
    const [rows] = await getConnection().execute(`SELECT t.*, c.nombre_categoria 
      FROM tipos_cultivo t INNER JOIN categorias_cultivo c ON c.id_categoria=t.id_categoria 
      ORDER BY c.nombre_categoria, t.nombre_tipo`);
    return rows;
  },
  async findByCategoria(id_categoria){
    const [rows] = await getConnection().execute('SELECT * FROM tipos_cultivo WHERE id_categoria=? ORDER BY nombre_tipo',[id_categoria]);
    return rows;
  },
  async findById(id){
    const [rows] = await getConnection().execute('SELECT * FROM tipos_cultivo WHERE id_tipo_cultivo=?',[id]);
    return rows[0];
  }
};

module.exports = TipoCultivo;

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
  },
  async findById(id){
    const [rows] = await getConnection().execute('SELECT * FROM insumos WHERE id_insumo=?',[id]);
    return rows[0];
  },
  async create(data){
    const { id_categoria_insumo, nombre_insumo, descripcion=null, fabricante=null, composicion=null, instrucciones_uso=null, precauciones=null } = data;
    if(!id_categoria_insumo) throw new Error('id_categoria_insumo requerido');
    if(!nombre_insumo) throw new Error('nombre_insumo requerido');
    const [res] = await getConnection().execute(
      `INSERT INTO insumos (id_categoria_insumo, nombre_insumo, descripcion, fabricante, composicion, instrucciones_uso, precauciones)
       VALUES (?,?,?,?,?,?,?)`,
      [id_categoria_insumo, nombre_insumo.trim(), descripcion, fabricante, composicion, instrucciones_uso, precauciones]
    );
    return await this.findById(res.insertId);
  },
  async update(id,data){
    const map = {
      id_categoria_insumo: 'id_categoria_insumo',
      nombre_insumo: 'nombre_insumo',
      descripcion: 'descripcion',
      fabricante: 'fabricante',
      composicion: 'composicion',
      instrucciones_uso: 'instrucciones_uso',
      precauciones: 'precauciones'
    };
    const sets=[]; const params=[];
    Object.keys(map).forEach(k=>{ if(k in data){ sets.push(`${map[k]}=?`); params.push(data[k]); } });
    if(!sets.length) return await this.findById(id);
    params.push(id);
    await getConnection().execute(`UPDATE insumos SET ${sets.join(', ')} WHERE id_insumo=?`, params);
    return await this.findById(id);
  },
  async delete(id){
    await getConnection().execute('DELETE FROM insumos WHERE id_insumo=?',[id]);
    return true;
  }
};

module.exports = Insumo;

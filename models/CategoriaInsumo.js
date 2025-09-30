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
  },
  async create(data){
    const { nombre_categoria, descripcion=null, tipo='otro' } = data;
    if(!nombre_categoria) throw new Error('nombre_categoria requerido');
    if(!tipo) throw new Error('tipo requerido');
    try {
      const [res] = await getConnection().execute(
        'INSERT INTO categorias_insumos (nombre_categoria, descripcion, tipo) VALUES (?,?,?)',
        [nombre_categoria.trim(), descripcion, tipo]
      );
      return await this.findById(res.insertId);
    } catch(e){
      if(e && e.code==='ER_DUP_ENTRY'){ const err=new Error('Nombre de categoría insumo ya existe'); err.code='DUP'; throw err; }
      throw e;
    }
  },
  async update(id,data){
    const fields=[]; const params=[];
    ['nombre_categoria','descripcion','tipo'].forEach(k=>{ if(k in data){ fields.push(`${k}=?`); params.push(data[k]); }});
    if(!fields.length) return await this.findById(id);
    params.push(id);
    try {
      await getConnection().execute(`UPDATE categorias_insumos SET ${fields.join(', ')} WHERE id_categoria_insumo=?`, params);
      return await this.findById(id);
    } catch(e){
      if(e && e.code==='ER_DUP_ENTRY'){ const err=new Error('Nombre de categoría insumo ya existe'); err.code='DUP'; throw err; }
      throw e;
    }
  },
  async delete(id){
    await getConnection().execute('DELETE FROM categorias_insumos WHERE id_categoria_insumo=?',[id]);
    return true;
  }
};

module.exports = CategoriaInsumo;

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
  },
  async create(data){
    const { nombre_categoria, descripcion=null, icono=null } = data;
    if(!nombre_categoria) throw new Error('nombre_categoria requerido');
    try {
      const [res] = await getConnection().execute(
        'INSERT INTO categorias_cultivo (nombre_categoria, descripcion, icono) VALUES (?,?,?)',
        [nombre_categoria.trim(), descripcion, icono]
      );
      return await this.findById(res.insertId);
    } catch(e){
      if(e && e.code === 'ER_DUP_ENTRY'){
        const err = new Error('Nombre de categoría ya existe');
        err.code='DUP';
        throw err;
      }
      throw e;
    }
  },
  async update(id,data){
    const fields=[]; const params=[];
    ['nombre_categoria','descripcion','icono'].forEach(k=>{ if(k in data){ fields.push(`${k}=?`); params.push(data[k]); }});
    if(!fields.length) return await this.findById(id);
    params.push(id);
    try {
      await getConnection().execute(`UPDATE categorias_cultivo SET ${fields.join(', ')} WHERE id_categoria=?`, params);
      return await this.findById(id);
    } catch(e){
      if(e && e.code==='ER_DUP_ENTRY'){
        const err = new Error('Nombre de categoría ya existe'); err.code='DUP'; throw err;
      }
      throw e;
    }
  },
  async delete(id){
    await getConnection().execute('DELETE FROM categorias_cultivo WHERE id_categoria=?',[id]);
    return true;
  }
};

module.exports = CategoriaCultivo;

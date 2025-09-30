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
  },
  async create(data){
    const { id_categoria, nombre_tipo, nombre_cientifico=null, descripcion=null, temporada_optima=null, dias_cosecha=null, requerimientos_climaticos=null } = data;
    if(!id_categoria) throw new Error('id_categoria requerido');
    if(!nombre_tipo) throw new Error('nombre_tipo requerido');
    const [res] = await getConnection().execute(
      `INSERT INTO tipos_cultivo (id_categoria, nombre_tipo, nombre_cientifico, descripcion, temporada_optima, dias_cosecha, requerimientos_climaticos)
       VALUES (?,?,?,?,?,?,?)`,
      [id_categoria, nombre_tipo.trim(), nombre_cientifico, descripcion, temporada_optima, dias_cosecha, requerimientos_climaticos? JSON.stringify(requerimientos_climaticos): null]
    );
    return await this.findById(res.insertId);
  },
  async update(id,data){
    const map = {
      id_categoria: 'id_categoria',
      nombre_tipo: 'nombre_tipo',
      nombre_cientifico: 'nombre_cientifico',
      descripcion: 'descripcion',
      temporada_optima: 'temporada_optima',
      dias_cosecha: 'dias_cosecha',
      requerimientos_climaticos: 'requerimientos_climaticos'
    };
    const sets=[]; const params=[];
    Object.keys(map).forEach(k=>{
      if(k in data){
        if(k==='requerimientos_climaticos' && data[k]){
          sets.push(`${map[k]}=?`); params.push(JSON.stringify(data[k]));
        } else {
          sets.push(`${map[k]}=?`); params.push(data[k]);
        }
      }
    });
    if(!sets.length) return await this.findById(id);
    params.push(id);
    await getConnection().execute(`UPDATE tipos_cultivo SET ${sets.join(', ')} WHERE id_tipo_cultivo=?`, params);
    return await this.findById(id);
  },
  async delete(id){
    await getConnection().execute('DELETE FROM tipos_cultivo WHERE id_tipo_cultivo=?',[id]);
    return true;
  }
};

module.exports = TipoCultivo;

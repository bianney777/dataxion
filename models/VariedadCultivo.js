// models/VariedadCultivo.js
const { getConnection } = require('../config/db');

const VariedadCultivo = {
  async findByTipo(id_tipo_cultivo){
    const [rows] = await getConnection().execute('SELECT * FROM variedades_cultivo WHERE id_tipo_cultivo=? ORDER BY nombre_variedad',[id_tipo_cultivo]);
    return rows;
  },
  async findById(id){
    const [rows] = await getConnection().execute('SELECT * FROM variedades_cultivo WHERE id_variedad=?',[id]);
    return rows[0];
  },
  async create(data){
    const { id_tipo_cultivo, nombre_variedad, caracteristicas=null, resistencia_enfermedades=null, rendimiento_esperado=null } = data;
    if(!id_tipo_cultivo) throw new Error('id_tipo_cultivo requerido');
    if(!nombre_variedad) throw new Error('nombre_variedad requerido');
    const [res] = await getConnection().execute(
      `INSERT INTO variedades_cultivo (id_tipo_cultivo, nombre_variedad, caracteristicas, resistencia_enfermedades, rendimiento_esperado)
       VALUES (?,?,?,?,?)`,
      [id_tipo_cultivo, nombre_variedad.trim(), caracteristicas, resistencia_enfermedades, rendimiento_esperado]
    );
    return await this.findById(res.insertId);
  },
  async update(id,data){
    const map = {
      id_tipo_cultivo: 'id_tipo_cultivo',
      nombre_variedad: 'nombre_variedad',
      caracteristicas: 'caracteristicas',
      resistencia_enfermedades: 'resistencia_enfermedades',
      rendimiento_esperado: 'rendimiento_esperado'
    };
    const sets=[]; const params=[];
    Object.keys(map).forEach(k=>{ if(k in data){ sets.push(`${map[k]}=?`); params.push(data[k]); } });
    if(!sets.length) return await this.findById(id);
    params.push(id);
    await getConnection().execute(`UPDATE variedades_cultivo SET ${sets.join(', ')} WHERE id_variedad=?`, params);
    return await this.findById(id);
  },
  async delete(id){
    await getConnection().execute('DELETE FROM variedades_cultivo WHERE id_variedad=?',[id]);
    return true;
  }
};

module.exports = VariedadCultivo;

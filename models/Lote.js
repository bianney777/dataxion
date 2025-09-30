// models/Lote.js
const { getConnection } = require('../config/db');

const Lote = {
  async findAllByFinca(id_finca) {
    const [rows] = await getConnection().execute('SELECT * FROM lotes WHERE id_finca = ?', [id_finca]);
    return rows;
  },
  async findById(id_lote) {
    const [rows] = await getConnection().execute('SELECT * FROM lotes WHERE id_lote = ?', [id_lote]);
    return rows[0];
  },
  async create(data) {
    // Manejo inteligente de coordenadas -> campo GEOMETRY (POINT) opcional
    const { wkt, isPoint } = buildGeometryWKT(data.coordenadas);
    const conn = getConnection();
    // Consola diagnóstica temporal
    console.log('[Lote.create] payload:', { ...data, coordenadas_original: data.coordenadas, wkt, isPoint });
    // 1) Intento con ST_GeomFromText si parece punto
    if (isPoint && wkt) {
      try {
        const [r1] = await conn.execute(
          `INSERT INTO lotes (id_finca, nombre_lote, area, coordenadas, descripcion, tipo_suelo, ph_suelo, capacidad_agua)
           VALUES (?,?,?,?,?,?,?,?)`,
          [data.id_finca, data.nombre_lote, normNum(data.area), { toSqlString:()=>`ST_GeomFromText('${wkt}')` }, data.descripcion || null, data.tipo_suelo || 'franco', normNum(data.ph_suelo), normNum(data.capacidad_agua)]
        );
        console.log('[Lote.create] Insert OK con ST_GeomFromText');
        return r1.insertId;
      } catch(e){
        console.warn('[Lote.create] Fallo ST_GeomFromText:', e.message);
        // 2) Intento con ST_SRID si es SRID 4326 típico
        try {
          const [r2] = await conn.execute(
            `INSERT INTO lotes (id_finca, nombre_lote, area, coordenadas, descripcion, tipo_suelo, ph_suelo, capacidad_agua)
             VALUES (?,?,?,?,?,?,?,?)`,
            [data.id_finca, data.nombre_lote, normNum(data.area), { toSqlString:()=>`ST_SRID(ST_GeomFromText('${wkt}'),4326)` }, data.descripcion || null, data.tipo_suelo || 'franco', normNum(data.ph_suelo), normNum(data.capacidad_agua)]
          );
          console.log('[Lote.create] Insert OK con ST_SRID');
          return r2.insertId;
        } catch(e2){
          console.warn('[Lote.create] Fallo ST_SRID:', e2.message);
        }
      }
    }
    // 3) Fallback: guardar NULL en coordenadas
    try {
      const [r3] = await conn.execute(
        `INSERT INTO lotes (id_finca, nombre_lote, area, coordenadas, descripcion, tipo_suelo, ph_suelo, capacidad_agua)
         VALUES (?,?,?,?,?,?,?,?)`,
        [data.id_finca, data.nombre_lote, normNum(data.area), null, data.descripcion || null, data.tipo_suelo || 'franco', normNum(data.ph_suelo), normNum(data.capacidad_agua)]
      );
      console.log('[Lote.create] Insert OK sin coordenadas');
      return r3.insertId;
    } catch(e3){
      console.error('[Lote.create] Falla insert incluso sin coordenadas:', e3.message);
      throw e3;
    }
  },
  async update(id_lote, data) {
    const { wkt, isPoint } = buildGeometryWKT(data.coordenadas);
    const conn = getConnection();
    let query, params;
    if (isPoint) {
      query = `UPDATE lotes SET nombre_lote=?, area=?, coordenadas=ST_GeomFromText(?), descripcion=?, tipo_suelo=?, ph_suelo=?, capacidad_agua=? WHERE id_lote=?`;
      params = [data.nombre_lote, normNum(data.area), wkt, data.descripcion || null, data.tipo_suelo, normNum(data.ph_suelo), normNum(data.capacidad_agua), id_lote];
      try {
        await conn.execute(query, params);
        return;
      } catch(e){
        if(/geometry object/i.test(e.message)){
          // Fallback: quitar coordenadas
          const q2 = `UPDATE lotes SET nombre_lote=?, area=?, coordenadas=NULL, descripcion=?, tipo_suelo=?, ph_suelo=?, capacidad_agua=? WHERE id_lote=?`;
          const p2 = [data.nombre_lote, normNum(data.area), data.descripcion || null, data.tipo_suelo, normNum(data.ph_suelo), normNum(data.capacidad_agua), id_lote];
          await conn.execute(q2, p2);
          return;
        }
        throw e;
      }
    } else if (data.coordenadas === '' || data.coordenadas == null) {
      query = `UPDATE lotes SET nombre_lote=?, area=?, coordenadas=NULL, descripcion=?, tipo_suelo=?, ph_suelo=?, capacidad_agua=? WHERE id_lote=?`;
      params = [data.nombre_lote, normNum(data.area), data.descripcion || null, data.tipo_suelo, normNum(data.ph_suelo), normNum(data.capacidad_agua), id_lote];
      await conn.execute(query, params);
    } else {
      query = `UPDATE lotes SET nombre_lote=?, area=?, descripcion=?, tipo_suelo=?, ph_suelo=?, capacidad_agua=? WHERE id_lote=?`;
      params = [data.nombre_lote, normNum(data.area), data.descripcion || null, data.tipo_suelo, normNum(data.ph_suelo), normNum(data.capacidad_agua), id_lote];
      await conn.execute(query, params);
    }
  },
  async delete(id_lote) {
    await getConnection().execute('DELETE FROM lotes WHERE id_lote = ?', [id_lote]);
  }
};

function buildGeometryWKT(raw){
  if(!raw) return { wkt:null, isPoint:false };
  // Admite formatos: "lat,lon" o "lon,lat" (detectamos rango). Preferimos lat,lon del formulario.
  const parts = String(raw).split(/[,\s]+/).filter(Boolean);
  if(parts.length === 2){
    let a = parseFloat(parts[0]);
    let b = parseFloat(parts[1]);
    if(isNaN(a)||isNaN(b)) return { wkt:null, isPoint:false };
    // Heurística: lat está entre -90 y 90. Si el primero no lo está pero el segundo sí, invertimos.
    let lat=a, lon=b;
    if(Math.abs(a)>90 && Math.abs(b)<=90){ lon=a; lat=b; }
    if(Math.abs(lat)>90 || Math.abs(lon)>180) return { wkt:null, isPoint:false };
    // WKT POINT(lon lat)
    return { wkt:`POINT(${lon} ${lat})`, isPoint:true };
  }
  return { wkt:null, isPoint:false };
}
function normNum(v){ if(v===undefined||v===null||v==='') return null; const n=Number(v); return isNaN(n)? null : n; }

module.exports = Lote;

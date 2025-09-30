// routes/ciclosApi.js - CRUD ciclos de cultivo
const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');
const { getConnection } = require('../config/db');

// Helper respuesta
function ok(res,data){ return res.json({ ok:true, data }); }
function fail(res,msg,code=400){ return res.status(code).json({ ok:false, message:msg }); }

async function q(sql, params){ const conn = getConnection(); return conn.execute(sql, params); }

// Cache simple de columnas existentes en ciclos_cultivo
let _ciclosColsCache = null; let _ciclosColsFetchedAt = 0;
async function getCiclosColumns(){
  const now = Date.now();
  if(_ciclosColsCache && (now - _ciclosColsFetchedAt) < 5*60*1000) return _ciclosColsCache;
  try {
    const [rows] = await q('DESCRIBE ciclos_cultivo');
    _ciclosColsCache = rows.map(r=> r.Field);
    _ciclosColsFetchedAt = now;
  } catch(e){
    console.error('[ciclosApi] No se pudo DESCRIBE ciclos_cultivo:', e.message);
    _ciclosColsCache = [];
  }
  return _ciclosColsCache;
}

// Construir dinamicamente SQL de inserción según columnas disponibles
function buildInsert(row, cols){
  const desiredOrder = ['nombre_ciclo','descripcion','fecha_inicio_estimada','fecha_fin_estimada','estado','fecha_cosecha_real','observaciones','avance_manual'];
  const present = desiredOrder.filter(c=> cols.includes(c));
  const names = present.concat(['actualizado_en']);
  const placeholders = present.map(()=>'?').concat(['NOW()']);
  const params = present.map(c=>{
    if(c==='estado') return row.estado || 'planificado';
    return row[c] != null? row[c] : null;
  });
  const sql = `INSERT INTO ciclos_cultivo (${names.join(',')}) VALUES (${placeholders.join(',')})`;
  return { sql, params };
}

// Construir dinamicamente UPDATE
function buildUpdate(id, row, cols){
  const desiredOrder = ['nombre_ciclo','descripcion','fecha_inicio_estimada','fecha_fin_estimada','estado','fecha_cosecha_real','observaciones','avance_manual'];
  const present = desiredOrder.filter(c=> cols.includes(c) && (row[c] !== undefined));
  if(!present.length) return null;
  const sets = present.map(c=> `${c}=?`).concat(['actualizado_en=NOW()']);
  const params = present.map(c=> row[c] != null? row[c]: null).concat([id]);
  const sql = `UPDATE ciclos_cultivo SET ${sets.join(', ')} WHERE id_ciclo=?`;
  return { sql, params };
}

// Derivar estado automático del ciclo según fechas y cultivos asociados
function deriveEstado(baseRow, cultivos){
  // Si está cancelado o completado en DB, respetar
  if(baseRow.estado === 'cancelado') return 'cancelado';
  const now = Date.now();
  const finReal = baseRow.fecha_cosecha_real && Date.parse(baseRow.fecha_cosecha_real);
  if(baseRow.estado === 'completado' || (finReal && !isNaN(finReal))) return 'completado';
  const finEst = baseRow.fecha_fin_estimada && Date.parse(baseRow.fecha_fin_estimada);
  const iniEst = baseRow.fecha_inicio_estimada && Date.parse(baseRow.fecha_inicio_estimada);
  if(iniEst && now < iniEst) return 'planificado';
  // Si no hay cultivos aún y ya pasó inicio -> en_progreso igualmente
  if(iniEst && now >= iniEst){
    // Si todos los cultivos (si existen) están cosechados/perdidos => completado
    if(cultivos && cultivos.length){
      const vivos = cultivos.filter(c=> !['cosechado','perdido'].includes(c.estado));
      if(!vivos.length) return 'completado';
    }
    // Si pasó fecha fin estimada y aún no completado => en_progreso (posible atraso)
    return 'en_progreso';
  }
  return baseRow.estado || 'planificado';
}

// Listar ciclos
router.get('/', ensureAuthenticated, async (req,res)=>{
  try {
    const [rows] = await q('SELECT * FROM ciclos_cultivo ORDER BY creado_en DESC');
    const ids = rows.map(r=> r.id_ciclo);
    let cultivosMap = {}, hitosMap = {}, hitosCountMap = {}, hitosDoneMap = {};
    if(ids.length){
      // cultivos asociados
      const [cult] = await q(`SELECT id_ciclo, estado, fecha_siembra, fecha_cosecha_real, fecha_floracion, fecha_germinacion FROM cultivos WHERE id_ciclo IN (${ids.map(()=>'?').join(',')})`, ids);
      cult.forEach(c=>{ (cultivosMap[c.id_ciclo] = cultivosMap[c.id_ciclo]||[]).push(c); });
      // métricas de hitos (tolerar ausencia de tabla)
      try {
        const [hstats] = await q(`SELECT id_ciclo, COUNT(*) total, SUM(CASE WHEN completado=1 THEN 1 ELSE 0 END) completados FROM ciclos_hitos WHERE id_ciclo IN (${ids.map(()=>'?').join(',')}) GROUP BY id_ciclo`, ids);
        hstats.forEach(h=>{ hitosCountMap[h.id_ciclo]=h.total; hitosDoneMap[h.id_ciclo]=h.completados; });
      } catch(e){ if(!(e.code==='ER_NO_SUCH_TABLE')) throw e; /* tabla no existe => sin hitos */ }
    }
    const nowTs = Date.now();
    const enriched = rows.map(r=>{
      const arrCult = cultivosMap[r.id_ciclo]||[];
      const estadoAuto = deriveEstado(r, arrCult);
      // Calcular avance
      let avance_pct = null;
      const totalH = hitosCountMap[r.id_ciclo]||0;
      const doneH = hitosDoneMap[r.id_ciclo]||0;
      if(totalH>0){
        avance_pct = Math.round(doneH/totalH*100);
      } else if(r.avance_manual != null){
        avance_pct = Number(r.avance_manual);
      } else if(r.fecha_inicio_estimada && r.fecha_fin_estimada){
        const ini = Date.parse(r.fecha_inicio_estimada), fin = Date.parse(r.fecha_fin_estimada);
        if(!isNaN(ini)&&!isNaN(fin)&& fin>ini){
          avance_pct = Math.max(0, Math.min(100, Math.round((nowTs - ini)/(fin-ini)*100)));
        } else avance_pct = 0;
      } else {
        avance_pct = 0;
      }
      return { ...r, estado_automatico: estadoAuto, total_cultivos: arrCult.length, avance_pct, hitos_total: totalH, hitos_completados: doneH };
    });
    ok(res, enriched);
  } catch(e){ console.error(e); fail(res,'Error listando ciclos',500); }
});

// Obtener uno
router.get('/:id', ensureAuthenticated, async (req,res)=>{
  try {
    const [rows] = await q('SELECT * FROM ciclos_cultivo WHERE id_ciclo=?',[req.params.id]);
    if(!rows.length) return fail(res,'No encontrado',404);
    const ciclo = rows[0];
    const [cult] = await q('SELECT id_cultivo, nombre_cultivo, estado, fecha_siembra, fecha_floracion, fecha_cosecha_esperada, fecha_cosecha_real FROM cultivos WHERE id_ciclo=?',[req.params.id]);
    let hitos = [];
    try {
      const [hh] = await q('SELECT id_hito, titulo, descripcion, fecha_objetivo, completado, orden FROM ciclos_hitos WHERE id_ciclo=? ORDER BY orden ASC, id_hito ASC',[req.params.id]);
      hitos = hh;
    } catch(e){ if(!(e.code==='ER_NO_SUCH_TABLE')) throw e; }
    const estadoAuto = deriveEstado(ciclo, cult);
    // Calcular avance detallado
    let avance_pct = null; let origen='';
    if(hitos.length){
      const done = hitos.filter(h=> h.completado).length;
      avance_pct = Math.round(done / hitos.length * 100); origen='hitos';
    } else if(ciclo.avance_manual != null){
      avance_pct = Number(ciclo.avance_manual); origen='manual';
    } else if(ciclo.fecha_inicio_estimada && ciclo.fecha_fin_estimada){
      const ini=Date.parse(ciclo.fecha_inicio_estimada), fin=Date.parse(ciclo.fecha_fin_estimada);
      if(!isNaN(ini)&&!isNaN(fin)&&fin>ini) { avance_pct = Math.max(0, Math.min(100, Math.round((Date.now()-ini)/(fin-ini)*100))); origen='fechas'; }
      else { avance_pct = 0; origen='indef'; }
    } else { avance_pct=0; origen='indef'; }
    ok(res, { ...ciclo, estado_automatico: estadoAuto, cultivos: cult, hitos, avance_pct, avance_origen: origen });
  } catch(e){ console.error(e); fail(res,'Error obteniendo ciclo',500); }
});

// Crear (con fallback si faltan columnas)
router.post('/', ensureAuthenticated, async (req,res)=>{
  try {
    const body = req.body || {};
    if(!body.nombre_ciclo) return fail(res,'nombre_ciclo requerido');
    const cols = await getCiclosColumns();
    const { sql, params } = buildInsert(body, cols);
    try {
      const [r] = await q(sql, params);
      const id = r.insertId;
      const [rowNew] = await q('SELECT * FROM ciclos_cultivo WHERE id_ciclo=?',[id]);
      ok(res, rowNew[0]);
    } catch(e){
      if(e.code==='ER_BAD_FIELD_ERROR') return fail(res,'Esquema de tabla ciclos_cultivo incompleto (falta alguna columna base). Añade columnas o revisa patch SQL.');
      throw e;
    }
  } catch(e){ console.error(e); fail(res,'Error creando ciclo',500); }
});

// Actualizar (con fallback columnas)
router.put('/:id', ensureAuthenticated, async (req,res)=>{
  try {
    const body = req.body || {};
    const cols = await getCiclosColumns();
    // Mensaje explícito si se intenta guardar avance_manual y la columna no existe
    if(body.avance_manual !== undefined && !cols.includes('avance_manual')){
      return fail(res,'La columna avance_manual no existe. Ejecuta patch SQL para habilitar progreso manual.');
    }
    const upd = buildUpdate(req.params.id, body, cols);
    if(!upd){
      const bodyKeys = Object.keys(body);
      return fail(res,`Nada que actualizar. Claves recibidas: [${bodyKeys.join(', ')}]. Columnas actualizables disponibles: [${cols.join(', ')}]. Si acabas de aplicar el patch SQL reinicia el servidor o refresca caché con GET /api/ciclos/schema/refresh`);
    }
    try {
      const [r] = await q(upd.sql, upd.params);
      if(r.affectedRows===0) return fail(res,'No encontrado',404);
      const [rowNew] = await q('SELECT * FROM ciclos_cultivo WHERE id_ciclo=?',[req.params.id]);
      ok(res, rowNew[0]);
    } catch(e){
      if(e.code==='ER_BAD_FIELD_ERROR') return fail(res,'Columna faltante en tabla ciclos_cultivo. Aplique patch SQL.');
      throw e;
    }
  } catch(e){ console.error(e); fail(res,'Error actualizando ciclo',500); }
});

// Endpoint diagnóstico de columnas disponibles
router.get('/schema/columns', ensureAuthenticated, async (req,res)=>{
  try { const cols = await getCiclosColumns(); ok(res,{ columns: cols }); }
  catch(e){ fail(res,'No se pudo obtener esquema',500); }
});

// Refrescar caché de columnas (por si se aplicó patch SQL sin reiniciar)
router.get('/schema/refresh', ensureAuthenticated, async (req,res)=>{
  try {
    _ciclosColsCache = null; _ciclosColsFetchedAt = 0;
    const cols = await getCiclosColumns();
    ok(res,{ columns: cols, refreshed: true });
  } catch(e){ fail(res,'No se pudo refrescar esquema',500); }
});

// Marcar ciclo como completado (idempotente)
router.post('/:id/complete', ensureAuthenticated, async (req,res)=>{
  try {
    const id = req.params.id;
    // Verificar existencia
    const [rows] = await q('SELECT * FROM ciclos_cultivo WHERE id_ciclo=?',[id]);
    if(!rows.length) return fail(res,'No encontrado',404);
    const ciclo = rows[0];
    const cols = await getCiclosColumns();
    const sets = [];
    const params = [];
    // Solo actualizar columnas que existan realmente
    if(cols.includes('estado') && ciclo.estado !== 'completado'){ sets.push('estado=?'); params.push('completado'); }
    if(cols.includes('fecha_cosecha_real') && !ciclo.fecha_cosecha_real){ sets.push('fecha_cosecha_real=CURDATE()'); }
    if(cols.includes('avance_manual')){ sets.push('avance_manual=100'); }
    if(!sets.length){
      // Nada que cambiar salvo quizá ya está completado
      return ok(res, { already: true, message: 'Ciclo ya estaba marcado o no hay columnas para actualizar' });
    }
    sets.push('actualizado_en=NOW()');
    const sql = `UPDATE ciclos_cultivo SET ${sets.join(', ')} WHERE id_ciclo=?`;
    params.push(id);
    await q(sql, params);
    // Intentar marcar hitos completados si tabla existe
    try { await q('UPDATE ciclos_hitos SET completado=1 WHERE id_ciclo=?',[id]); } catch(e){ if(!(e.code==='ER_NO_SUCH_TABLE')) throw e; }
    const [refreshed] = await q('SELECT * FROM ciclos_cultivo WHERE id_ciclo=?',[id]);
    ok(res, { completed: true, ciclo: refreshed[0] });
  } catch(e){ console.error(e); fail(res,'Error completando ciclo',500); }
});

module.exports = router;

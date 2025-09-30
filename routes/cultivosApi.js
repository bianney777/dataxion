// routes/cultivosApi.js - cultivos asociados a ciclos
const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');
const { getConnection } = require('../config/db');
function ok(res,data){ return res.json({ ok:true, data }); }
function fail(res,msg,code=400){ return res.status(code).json({ ok:false, message:msg }); }
async function q(sql,params){ const c=getConnection(); return c.execute(sql,params); }

// Listar cultivos por ciclo
router.get('/', ensureAuthenticated, async (req,res)=>{
  try {
    const { ciclo, lote } = req.query;
    let where = []; let params=[];
    if(ciclo){ where.push('id_ciclo=?'); params.push(ciclo); }
    if(lote){ where.push('id_lote=?'); params.push(lote); }
    const sql = 'SELECT * FROM cultivos'+(where.length? ' WHERE '+ where.join(' AND '): '')+' ORDER BY creado_en DESC';
    const [rows] = await q(sql, params);
    ok(res, rows);
  } catch(e){ console.error(e); fail(res,'Error listando cultivos',500); }
});

// Obtener uno
router.get('/:id', ensureAuthenticated, async (req,res)=>{
  try {
    const [rows] = await q('SELECT * FROM cultivos WHERE id_cultivo=?',[req.params.id]);
    if(!rows.length) return fail(res,'No encontrado',404);
    ok(res, rows[0]);
  } catch(e){ console.error(e); fail(res,'Error obteniendo cultivo',500); }
});

// Crear cultivo
router.post('/', ensureAuthenticated, async (req,res)=>{
  try {
    const { id_lote, id_variedad, id_ciclo, nombre_cultivo, area_cultivo, fecha_siembra, fecha_germinacion, fecha_floracion, fecha_cosecha_esperada, densidad_siembra, estado, observaciones } = req.body;
    if(!id_lote || !id_variedad || !id_ciclo || !nombre_cultivo) return fail(res,'Campos requeridos faltan');
    const [r] = await q(`INSERT INTO cultivos (id_lote,id_variedad,id_ciclo,nombre_cultivo,area_cultivo,fecha_siembra,fecha_germinacion,fecha_floracion,fecha_cosecha_esperada,densidad_siembra,estado,observaciones)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [ id_lote,id_variedad,id_ciclo,nombre_cultivo,area_cultivo||0,fecha_siembra||null,fecha_germinacion||null,fecha_floracion||null,fecha_cosecha_esperada||null,densidad_siembra||null,estado||'planificado',observaciones||null ]);
    const id = r.insertId; const [nw] = await q('SELECT * FROM cultivos WHERE id_cultivo=?',[id]);
    ok(res, nw[0]);
  } catch(e){ console.error(e); fail(res,'Error creando cultivo',500); }
});

// Actualizar
router.put('/:id', ensureAuthenticated, async (req,res)=>{
  try {
    const { nombre_cultivo, area_cultivo, fecha_siembra, fecha_germinacion, fecha_floracion, fecha_cosecha_esperada, fecha_cosecha_real, densidad_siembra, estado, observaciones } = req.body;
    const [r] = await q(`UPDATE cultivos SET nombre_cultivo=?, area_cultivo=?, fecha_siembra=?, fecha_germinacion=?, fecha_floracion=?, fecha_cosecha_esperada=?, fecha_cosecha_real=?, densidad_siembra=?, estado=?, observaciones=?, actualizado_en=NOW() WHERE id_cultivo=?`, [ nombre_cultivo||null, area_cultivo||0, fecha_siembra||null, fecha_germinacion||null, fecha_floracion||null, fecha_cosecha_esperada||null, fecha_cosecha_real||null, densidad_siembra||null, estado||null, observaciones||null, req.params.id ]);
    if(!r.affectedRows) return fail(res,'No encontrado',404);
    const [nw] = await q('SELECT * FROM cultivos WHERE id_cultivo=?',[req.params.id]);
    ok(res, nw[0]);
  } catch(e){ console.error(e); fail(res,'Error actualizando cultivo',500); }
});

// Eliminar
router.delete('/:id', ensureAuthenticated, async (req,res)=>{
  try { const [r] = await q('DELETE FROM cultivos WHERE id_cultivo=?',[req.params.id]); if(!r.affectedRows) return fail(res,'No encontrado',404); ok(res,true); } catch(e){ console.error(e); fail(res,'Error eliminando cultivo',500); }
});

module.exports = router;

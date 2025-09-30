// routes/ciclosHitosApi.js - CRUD de hitos para ciclos de cultivo
const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');
const { getConnection } = require('../config/db');

function ok(res,data){ return res.json({ ok:true, data }); }
function fail(res,msg,code=400){ return res.status(code).json({ ok:false, message:msg }); }
async function q(sql, params){ const conn = getConnection(); return conn.execute(sql, params); }

// Listar hitos de un ciclo
router.get('/ciclos/:id/hitos', ensureAuthenticated, async (req,res)=>{
  try {
    const [rows] = await q('SELECT * FROM ciclos_hitos WHERE id_ciclo=? ORDER BY orden ASC, id_hito ASC',[req.params.id]);
    ok(res, rows);
  } catch(e){ console.error(e); fail(res,'Error listando hitos',500); }
});

// Crear hito
router.post('/ciclos/:id/hitos', ensureAuthenticated, async (req,res)=>{
  try {
    const { titulo, descripcion, fecha_objetivo } = req.body;
    if(!titulo) return fail(res,'titulo requerido');
    // calcular orden (max+1)
    const [m] = await q('SELECT COALESCE(MAX(orden),0)+1 AS nextOrden FROM ciclos_hitos WHERE id_ciclo=?',[req.params.id]);
    const nextOrden = m[0].nextOrden || 1;
    const [r] = await q('INSERT INTO ciclos_hitos (id_ciclo, titulo, descripcion, fecha_objetivo, completado, orden) VALUES (?,?,?,?,0,?)', [req.params.id, titulo, descripcion||null, fecha_objetivo||null, nextOrden]);
    const [row] = await q('SELECT * FROM ciclos_hitos WHERE id_hito=?',[r.insertId]);
    ok(res,row[0]);
  } catch(e){ console.error(e); fail(res,'Error creando hito',500); }
});

// Toggle completado rápido
router.patch('/hitos/:id/toggle', ensureAuthenticated, async (req,res)=>{
  try {
    const [cur] = await q('SELECT completado FROM ciclos_hitos WHERE id_hito=?',[req.params.id]);
    if(!cur.length) return fail(res,'No encontrado',404);
    const nuevo = cur[0].completado? 0:1;
    const [r] = await q('UPDATE ciclos_hitos SET completado=?, orden=orden, titulo=titulo WHERE id_hito=?',[nuevo, req.params.id]);
    if(r.affectedRows===0) return fail(res,'No actualizado',400);
    const [row] = await q('SELECT * FROM ciclos_hitos WHERE id_hito=?',[req.params.id]);
    ok(res,row[0]);
  } catch(e){ console.error(e); fail(res,'Error actualizando hito',500); }
});

// Actualizar hito
router.put('/hitos/:id', ensureAuthenticated, async (req,res)=>{
  try {
    const { titulo, descripcion, fecha_objetivo, completado, orden } = req.body;
    const [r] = await q('UPDATE ciclos_hitos SET titulo=COALESCE(?,titulo), descripcion=COALESCE(?,descripcion), fecha_objetivo=COALESCE(?,fecha_objetivo), completado=COALESCE(?,completado), orden=COALESCE(?,orden) WHERE id_hito=?',[ titulo||null, descripcion||null, fecha_objetivo||null, typeof completado==='number'? completado:null, typeof orden==='number'? orden:null, req.params.id ]);
    if(r.affectedRows===0) return fail(res,'No encontrado',404);
    const [row] = await q('SELECT * FROM ciclos_hitos WHERE id_hito=?',[req.params.id]);
    ok(res,row[0]);
  } catch(e){ console.error(e); fail(res,'Error modificando hito',500); }
});

// Eliminar hito
router.delete('/hitos/:id', ensureAuthenticated, async (req,res)=>{
  try {
    const [r] = await q('DELETE FROM ciclos_hitos WHERE id_hito=?',[req.params.id]);
    if(r.affectedRows===0) return fail(res,'No encontrado',404);
    ok(res,true);
  } catch(e){ console.error(e); fail(res,'Error eliminando hito',500); }
});

module.exports = router;
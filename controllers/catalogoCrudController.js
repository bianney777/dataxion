// controllers/catalogoCrudController.js
const CategoriaCultivo = require('../models/CategoriaCultivo');
const TipoCultivo = require('../models/TipoCultivo');
const VariedadCultivo = require('../models/VariedadCultivo');
const CategoriaInsumo = require('../models/CategoriaInsumo');
const Insumo = require('../models/Insumo');

function ok(res, data){ return res.json({ ok:true, data }); }
function fail(res, message, code='ERR', status=400){ return res.status(status).json({ ok:false, code, message }); }

module.exports = {
  // Categorías cultivo
  async listCategoriasCultivo(req,res){ try { ok(res, await CategoriaCultivo.findAll()); } catch(e){ console.error(e); fail(res,'Error listando categorías'); } },
  async createCategoriaCultivo(req,res){ try { const cat = await CategoriaCultivo.create(req.body); ok(res,cat); } catch(e){ fail(res,e.message, e.code==='DUP'?'DUP':'ERR'); } },
  async getCategoriaCultivo(req,res){ try { const c= await CategoriaCultivo.findById(req.params.id); if(!c) return fail(res,'No encontrado','NOT_FOUND',404); ok(res,c);} catch(e){ fail(res,'Error'); } },
  async updateCategoriaCultivo(req,res){ try { const id=req.params.id; const ex=await CategoriaCultivo.findById(id); if(!ex) return fail(res,'No existe', 'NOT_FOUND',404); const upd= await CategoriaCultivo.update(id, req.body); ok(res, upd); } catch(e){ fail(res,e.message, e.code==='DUP'?'DUP':'ERR'); } },
  async deleteCategoriaCultivo(req,res){ try { const id=req.params.id; await CategoriaCultivo.delete(id); ok(res,true); } catch(e){ fail(res,'No se pudo eliminar'); } },

  // Tipos cultivo
  async listTiposCultivo(req,res){ try { ok(res, await TipoCultivo.findAll()); } catch(e){ console.error(e); fail(res,'Error listando tipos'); } },
  async createTipoCultivo(req,res){ try { const t= await TipoCultivo.create(req.body); ok(res,t); } catch(e){ fail(res,e.message); } },
  async getTipoCultivo(req,res){ try { const t= await TipoCultivo.findById(req.params.id); if(!t) return fail(res,'No encontrado','NOT_FOUND',404); ok(res,t);} catch(e){ fail(res,'Error'); } },
  async updateTipoCultivo(req,res){ try { const id=req.params.id; const ex=await TipoCultivo.findById(id); if(!ex) return fail(res,'No existe','NOT_FOUND',404); const upd= await TipoCultivo.update(id, req.body); ok(res,upd); } catch(e){ fail(res,e.message); } },
  async deleteTipoCultivo(req,res){ try { const id=req.params.id; await TipoCultivo.delete(id); ok(res,true); } catch(e){ fail(res,'No se pudo eliminar'); } },

  // Variedades
  async listVariedadesCultivo(req,res){ try { const { id_tipo_cultivo } = req.query; if(!id_tipo_cultivo) return fail(res,'id_tipo_cultivo requerido'); ok(res, await VariedadCultivo.findByTipo(id_tipo_cultivo)); } catch(e){ console.error(e); fail(res,'Error listando variedades'); } },
  async createVariedadCultivo(req,res){ try { const v= await VariedadCultivo.create(req.body); ok(res,v); } catch(e){ fail(res,e.message); } },
  async getVariedadCultivo(req,res){ try { const v= await VariedadCultivo.findById(req.params.id); if(!v) return fail(res,'No encontrado','NOT_FOUND',404); ok(res,v);} catch(e){ fail(res,'Error'); } },
  async updateVariedadCultivo(req,res){ try { const id=req.params.id; const ex=await VariedadCultivo.findById(id); if(!ex) return fail(res,'No existe','NOT_FOUND',404); const upd= await VariedadCultivo.update(id, req.body); ok(res,upd); } catch(e){ fail(res,e.message); } },
  async deleteVariedadCultivo(req,res){ try { const id=req.params.id; await VariedadCultivo.delete(id); ok(res,true); } catch(e){ fail(res,'No se pudo eliminar'); } },

  // Categorías insumo
  async listCategoriasInsumo(req,res){ try { ok(res, await CategoriaInsumo.findAll()); } catch(e){ console.error(e); fail(res,'Error listando categorías insumo'); } },
  async createCategoriaInsumo(req,res){ try { const cat = await CategoriaInsumo.create(req.body); ok(res,cat); } catch(e){ fail(res,e.message, e.code==='DUP'?'DUP':'ERR'); } },
  async getCategoriaInsumo(req,res){ try { const c= await CategoriaInsumo.findById(req.params.id); if(!c) return fail(res,'No encontrado','NOT_FOUND',404); ok(res,c);} catch(e){ fail(res,'Error'); } },
  async updateCategoriaInsumo(req,res){ try { const id=req.params.id; const ex=await CategoriaInsumo.findById(id); if(!ex) return fail(res,'No existe','NOT_FOUND',404); const upd= await CategoriaInsumo.update(id, req.body); ok(res,upd); } catch(e){ fail(res,e.message, e.code==='DUP'?'DUP':'ERR'); } },
  async deleteCategoriaInsumo(req,res){ try { const id=req.params.id; await CategoriaInsumo.delete(id); ok(res,true); } catch(e){ fail(res,'No se pudo eliminar'); } },

  // Insumos
  async listInsumos(req,res){ try { const { id_categoria_insumo } = req.query; if(id_categoria_insumo){ return ok(res, await Insumo.findByCategoria(id_categoria_insumo)); } ok(res, await Insumo.findAll()); } catch(e){ console.error(e); fail(res,'Error listando insumos'); } },
  async createInsumo(req,res){ try { const ins= await Insumo.create(req.body); ok(res,ins); } catch(e){ fail(res,e.message); } },
  async getInsumo(req,res){ try { const i= await Insumo.findById(req.params.id); if(!i) return fail(res,'No encontrado','NOT_FOUND',404); ok(res,i);} catch(e){ fail(res,'Error'); } },
  async updateInsumo(req,res){ try { const id=req.params.id; const ex=await Insumo.findById(id); if(!ex) return fail(res,'No existe','NOT_FOUND',404); const upd= await Insumo.update(id, req.body); ok(res,upd); } catch(e){ fail(res,e.message); } },
  async deleteInsumo(req,res){ try { const id=req.params.id; await Insumo.delete(id); ok(res,true); } catch(e){ fail(res,'No se pudo eliminar'); } }
  ,
  // --- Unificado ---
  async unified(req,res){
    try {
      const [catsCultivo, tipos, catsInsumo, insumos] = await Promise.all([
        CategoriaCultivo.findAll(),
        TipoCultivo.findAll(),
        CategoriaInsumo.findAll(),
        Insumo.findAll()
      ]);
      const tiposMap = tipos.reduce((acc,t)=>{ (acc[t.id_categoria] = acc[t.id_categoria]|| []).push({
        id: t.id_tipo_cultivo,
        nombre: t.nombre_tipo,
        dias_cosecha: t.dias_cosecha || null,
        temporada: t.temporada_optima || null
      }); return acc; }, {});
      const insMap = insumos.reduce((acc,i)=>{ (acc[i.id_categoria_insumo] = acc[i.id_categoria_insumo]|| []).push({
        id: i.id_insumo,
        nombre: i.nombre_insumo,
        fabricante: i.fabricante || null,
        tipo: i.tipo || null
      }); return acc; }, {});
      const data = [
        ...catsCultivo.map(cat=>({
          kind:'cultivo',
            id: cat.id_categoria,
            nombre: cat.nombre_categoria,
            icono: cat.icono || null,
            descripcion: cat.descripcion || null,
            count: (tiposMap[cat.id_categoria]||[]).length,
            tipos: tiposMap[cat.id_categoria]||[]
        })),
        ...catsInsumo.map(cat=>({
          kind:'insumo',
            id: cat.id_categoria_insumo,
            nombre: cat.nombre_categoria,
            tipoCategoria: cat.tipo || null,
            descripcion: cat.descripcion || null,
            count: (insMap[cat.id_categoria_insumo]||[]).length,
            insumos: insMap[cat.id_categoria_insumo]||[]
        }))
      ];
      ok(res, data);
    } catch(e){ console.error(e); fail(res,'Error unificando catálogo'); }
  },
  async logEvent(req,res){
    try {
      const { action, targetKind, targetId, meta } = req.body || {};
      if(!action) return fail(res,'action requerido');
      const payload = { ts: new Date().toISOString(), user: (req.user && req.user.id)||null, action, targetKind: targetKind||null, targetId: targetId||null, meta: meta||null };
      console.log('[catalog-event]', JSON.stringify(payload));
      ok(res,true);
    } catch(e){ fail(res,'No se registró evento'); }
  }
};
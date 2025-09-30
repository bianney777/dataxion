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
};
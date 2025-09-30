// controllers/catalogoController.js
const CategoriaCultivo = require('../models/CategoriaCultivo');
const TipoCultivo = require('../models/TipoCultivo');
const VariedadCultivo = require('../models/VariedadCultivo');
const CategoriaInsumo = require('../models/CategoriaInsumo');
const Insumo = require('../models/Insumo');

module.exports = {
  async index(req, res){
    try {
      const [categoriasCultivo, tiposCultivo, categoriasInsumo, insumos] = await Promise.all([
        CategoriaCultivo.findAll(),
        TipoCultivo.findAll(),
        CategoriaInsumo.findAll(),
        Insumo.findAll()
      ]);
      // Agrupar tipos por categoria
      const tiposPorCategoria = tiposCultivo.reduce((acc,t)=>{
        (acc[t.id_categoria] ||= []).push(t); return acc; }, {});
      // Variedades bajo demanda (carga dinámica posterior si se requiere) -> no se precarga para performance
      res.render('catalogo', {
        user: req.user,
        categoriasCultivo,
        tiposPorCategoria,
        categoriasInsumo,
        insumos
      });
    } catch(e){
      console.error('[catalogoController.index]', e);
      res.status(500).send('Error cargando catálogo');
    }
  }
};

// routes/catalogoApi.js
const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');
const catalogoCrudController = require('../controllers/catalogoCrudController');

// CULTIVOS: categorias
router.get('/categorias-cultivo', ensureAuthenticated, catalogoCrudController.listCategoriasCultivo);
router.get('/categorias-cultivo/:id', ensureAuthenticated, catalogoCrudController.getCategoriaCultivo);
router.post('/categorias-cultivo', ensureAuthenticated, catalogoCrudController.createCategoriaCultivo);
router.put('/categorias-cultivo/:id', ensureAuthenticated, catalogoCrudController.updateCategoriaCultivo);
router.delete('/categorias-cultivo/:id', ensureAuthenticated, catalogoCrudController.deleteCategoriaCultivo);

// CULTIVOS: tipos
router.get('/tipos-cultivo', ensureAuthenticated, catalogoCrudController.listTiposCultivo);
router.get('/tipos-cultivo/:id', ensureAuthenticated, catalogoCrudController.getTipoCultivo);
router.post('/tipos-cultivo', ensureAuthenticated, catalogoCrudController.createTipoCultivo);
router.put('/tipos-cultivo/:id', ensureAuthenticated, catalogoCrudController.updateTipoCultivo);
router.delete('/tipos-cultivo/:id', ensureAuthenticated, catalogoCrudController.deleteTipoCultivo);

// CULTIVOS: variedades
router.get('/variedades-cultivo', ensureAuthenticated, catalogoCrudController.listVariedadesCultivo);
router.get('/variedades-cultivo/:id', ensureAuthenticated, catalogoCrudController.getVariedadCultivo);
router.post('/variedades-cultivo', ensureAuthenticated, catalogoCrudController.createVariedadCultivo);
router.put('/variedades-cultivo/:id', ensureAuthenticated, catalogoCrudController.updateVariedadCultivo);
router.delete('/variedades-cultivo/:id', ensureAuthenticated, catalogoCrudController.deleteVariedadCultivo);

// INSUMOS: categorias
router.get('/categorias-insumo', ensureAuthenticated, catalogoCrudController.listCategoriasInsumo);
router.get('/categorias-insumo/:id', ensureAuthenticated, catalogoCrudController.getCategoriaInsumo);
router.post('/categorias-insumo', ensureAuthenticated, catalogoCrudController.createCategoriaInsumo);
router.put('/categorias-insumo/:id', ensureAuthenticated, catalogoCrudController.updateCategoriaInsumo);
router.delete('/categorias-insumo/:id', ensureAuthenticated, catalogoCrudController.deleteCategoriaInsumo);

// INSUMOS
router.get('/insumos', ensureAuthenticated, catalogoCrudController.listInsumos);
router.get('/insumos/:id', ensureAuthenticated, catalogoCrudController.getInsumo);
router.post('/insumos', ensureAuthenticated, catalogoCrudController.createInsumo);
router.put('/insumos/:id', ensureAuthenticated, catalogoCrudController.updateInsumo);
router.delete('/insumos/:id', ensureAuthenticated, catalogoCrudController.deleteInsumo);

module.exports = router;
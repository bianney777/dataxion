// routes/gestionfinca.js
const express = require('express');
const router = express.Router();
const gestionFincaController = require('../controllers/gestionFincaController');
const ensureAuthenticated = require('../middleware/auth');

// FINCAS
router.get('/', ensureAuthenticated, gestionFincaController.listFincas);
router.post('/create', ensureAuthenticated, gestionFincaController.createFinca);
router.get('/:id/edit', ensureAuthenticated, gestionFincaController.editFinca);
router.post('/:id/update', ensureAuthenticated, gestionFincaController.updateFinca);
router.post('/:id/delete', ensureAuthenticated, gestionFincaController.deleteFinca);

// API FINCAS JSON (búsqueda, filtro, paginación)
router.get('/api/fincas', ensureAuthenticated, gestionFincaController.apiListFincas);
router.get('/api/fincas/metrics', ensureAuthenticated, gestionFincaController.apiFincasMetrics);

// LOTES
router.get('/:id_finca/lotes', ensureAuthenticated, gestionFincaController.listLotes);
router.post('/lotes/create', ensureAuthenticated, gestionFincaController.createLote);
router.get('/lotes/:id/edit', ensureAuthenticated, gestionFincaController.editLote);
router.post('/lotes/:id/update', ensureAuthenticated, gestionFincaController.updateLote);
router.post('/lotes/:id/delete', ensureAuthenticated, gestionFincaController.deleteLote);

// API LOTES JSON
router.get('/api/fincas/:id_finca/lotes', ensureAuthenticated, gestionFincaController.apiListLotes);
router.get('/api/fincas/:id_finca/lotes/metrics', ensureAuthenticated, gestionFincaController.apiLotesMetrics);

// API ZONAS
router.get('/api/zonas', ensureAuthenticated, gestionFincaController.apiListZonas);

module.exports = router;

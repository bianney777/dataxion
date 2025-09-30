// routes/catalogo.js
const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');
const catalogoController = require('../controllers/catalogoController');

router.get('/', ensureAuthenticated, catalogoController.index);

module.exports = router;
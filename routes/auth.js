// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Renderizar vistas
router.get('/login', (req, res) => {
	res.render('login', { error: null });
});

router.get('/register', (req, res) => {
	res.render('register', { error: null });
});

// Procesar formularios
router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;
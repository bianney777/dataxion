// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware para redirigir si ya está autenticado
function redirectIfAuth(req, res, next){
	var token = null;
	if (req.cookies && req.cookies.token) token = req.cookies.token;
	else if (req.headers && req.headers['authorization']) {
		var parts = req.headers['authorization'].split(' ');
		if (parts.length === 2) token = parts[1];
	}
	if(!token) return next();
	const jwt = require('jsonwebtoken');
	try {
		jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
		return res.redirect('/dashboard');
	} catch(e){ return next(); }
}

// Renderizar vistas
router.get('/login', redirectIfAuth, (req, res) => {
	res.render('login', { error: null });
});

router.get('/register', redirectIfAuth, (req, res) => {
	res.render('register', { error: null });
});

// Verificación deshabilitada (activación automática)
router.get('/verify', (req,res)=> res.redirect('/dashboard'));
router.post('/verify', (req,res)=> res.redirect('/dashboard'));

// Procesar formularios
router.post('/login', authController.login);
router.post('/register', authController.register);

// API legacy deshabilitada
router.post('/verify-code', (req,res)=> res.status(410).json({ ok:false, message:'Verificación deshabilitada' }));

module.exports = router;
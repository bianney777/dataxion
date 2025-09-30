// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware para redirigir si ya está autenticado
function redirectIfAuth(req, res, next){
	const token = req.cookies?.token || (req.headers['authorization']?.split(' ')[1]);
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

// Procesar formularios
router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;
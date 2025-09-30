// routes/ciclos.js - vista ciclos
const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');

router.get('/', ensureAuthenticated, async (req,res)=>{
  try {
    // La vista carga datos vía fetch /api/ciclos, así que sólo renderizamos estructura.
    res.render('ciclos', { user: req.user || null });
  } catch(e){
    console.error('Render ciclos error', e);
    res.status(500).send('Error al cargar ciclos');
  }
});

module.exports = router;

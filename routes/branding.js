const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');

// Definición de identidad visual (puedes ajustar luego)
const brandData = {
  nombre: 'DataXion',
  slogan: 'Cultivando decisiones inteligentes',
  logoPath: '/images/logo-dataxion.png', // Asegúrate de colocar esta imagen
  descripcion: 'Plataforma para gestión agrícola, analítica y optimización de ciclos productivos.',
  paleta: [
    { nombre: 'Primario', hex: '#1B4DFF' },
    { nombre: 'Secundario', hex: '#0A2A6B' },
    { nombre: 'Acento Verde', hex: '#3CCB7F' },
    { nombre: 'Neutro Oscuro', hex: '#1E1E24' },
    { nombre: 'Neutro Claro', hex: '#F5F7FA' }
  ],
  valores: [
    {
      titulo: 'Precisión',
      detalle: 'Datos limpios y métricas confiables para decisiones certeras.',
      icon: '🎯'
    },
    {
      titulo: 'Eficiencia',
      detalle: 'Automatizamos y reducimos fricción operativa.',
      icon: '⚙️'
    },
    {
      titulo: 'Sostenibilidad',
      detalle: 'Optimiza recursos y minimiza desperdicios.',
      icon: '🌱'
    },
    {
      titulo: 'Escalabilidad',
      detalle: 'Arquitectura lista para crecer con tu operación.',
      icon: '📈'
    },
    {
      titulo: 'Transparencia',
      detalle: 'Visibilidad clara de procesos y resultados.',
      icon: '🔍'
    }
  ],
  moodboard: [
    { tipo:'concepto', label:'Tecnología Agrícola' },
    { tipo:'concepto', label:'Crecimiento' },
    { tipo:'concepto', label:'Datos en Tiempo Real' },
    { tipo:'concepto', label:'Inteligencia Predictiva' },
    { tipo:'concepto', label:'Sostenibilidad' },
    { tipo:'concepto', label:'Optimización de Recursos' }
  ],
  tipografias: [
    { nombre: 'Inter', uso: 'UI, tablas y formularios' },
    { nombre: 'Poppins', uso: 'Títulos y elementos destacados' }
  ]
};

router.get('/', ensureAuthenticated, (req,res)=>{
  res.render('branding', { user: req.user, brand: brandData });
});

module.exports = router;
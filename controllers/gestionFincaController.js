// controllers/gestionFincaController.js
const Finca = require('../models/Finca');
const Lote = require('../models/Lote');
const Zona = require('../models/Zona');

const gestionFincaController = {
  // FINCAS
  async listFincas(req, res) {
    const fincas = await Finca.findAllByUser(req.user.id);
    const zonas = await Zona.findAll();
    res.render('gestionfinca', { user: req.user, fincas, lotes: [], selectedFinca: null, selectedLote: null, zonas });
  },
  async createFinca(req, res) {
    await Finca.create({ ...req.body, id_usuario: req.user.id });
    res.redirect('/gestionfinca');
  },
  async editFinca(req, res) {
    const finca = await Finca.findById(req.params.id);
    const zonas = await Zona.findAll();
    res.render('gestionfinca', { user: req.user, fincas: [], lotes: [], selectedFinca: finca, selectedLote: null, zonas });
  },
  async updateFinca(req, res) {
    await Finca.update(req.params.id, req.body);
    res.redirect('/gestionfinca');
  },
  async deleteFinca(req, res) {
    await Finca.delete(req.params.id);
    res.redirect('/gestionfinca');
  },
  // LOTES
  async listLotes(req, res) {
    // Aseguramos que selectedFinca sea el objeto completo para que la vista pueda usar selectedFinca.id_finca
    const finca = await Finca.findById(req.params.id_finca);
    const lotes = await Lote.findAllByFinca(req.params.id_finca);
    const zonas = await Zona.findAll();
    res.render('gestionfinca', { user: req.user, fincas: [], lotes: lotes || [], selectedFinca: finca || { id_finca: req.params.id_finca }, selectedLote: null, zonas });
  },
  async createLote(req, res) {
    await Lote.create(req.body);
    res.redirect(`/gestionfinca/${req.body.id_finca}/lotes`);
  },
  async editLote(req, res) {
    const lote = await Lote.findById(req.params.id);
    const zonas = await Zona.findAll();
    res.render('gestionfinca', { user: req.user, fincas: [], lotes: [], selectedFinca: null, selectedLote: lote, zonas });
  },
  async updateLote(req, res) {
    await Lote.update(req.params.id, req.body);
    res.redirect(`/gestionfinca/${req.body.id_finca}/lotes`);
  },
  async deleteLote(req, res) {
    await Lote.delete(req.params.id);
    res.redirect(`/gestionfinca/${req.body.id_finca}/lotes`);
  },
  // API JSON FINCAS
  async apiListFincas(req, res) {
    try {
      const { q = '', estado, page = 1, limit = 12 } = req.query;
      const fincas = await Finca.findAllByUser(req.user.id);
      let filtered = fincas.filter(f => {
        const matchQ = q ? (f.nombre_finca?.toLowerCase().includes(q.toLowerCase()) || f.ubicacion?.toLowerCase().includes(q.toLowerCase())) : true;
        const matchEstado = estado ? f.estado === estado : true;
        return matchQ && matchEstado;
      });
      const total = filtered.length;
      const pageNum = parseInt(page) || 1;
      const lim = parseInt(limit) || 12;
      const start = (pageNum - 1) * lim;
      const rows = filtered.slice(start, start + lim);
      res.json({ ok: true, data: rows, pagination: { total, page: pageNum, pages: Math.ceil(total / lim), limit: lim } });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  },
  async apiFincasMetrics(req, res) {
    try {
      const fincas = await Finca.findAllByUser(req.user.id);
      if (!fincas.length) return res.json({ ok: true, metrics: { total: 0, areaTotal: 0, activasPct: 0 } });
      const areaTotal = fincas.reduce((acc, f) => acc + (parseFloat(f.area_total) || 0), 0);
      const activas = fincas.filter(f => f.estado === 'activa').length;
      res.json({ ok: true, metrics: { total: fincas.length, areaTotal, activasPct: +(activas / fincas.length * 100).toFixed(1) } });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  },
  // API JSON LOTES
  async apiListLotes(req, res) {
    try {
      const { q = '', tipo_suelo, page = 1, limit = 12 } = req.query;
      const lotes = await Lote.findAllByFinca(req.params.id_finca) || [];
      let filtered = lotes.filter(l => {
        // Manejo seguro de coordenadas si es Buffer (campo GEOMETRY) o string
        let coordStr = '';
        if (typeof l.coordenadas === 'string') coordStr = l.coordenadas;
        else if (Buffer.isBuffer(l.coordenadas)) coordStr = l.coordenadas.toString();
        const mq = q ? (
          (l.nombre_lote && l.nombre_lote.toLowerCase().includes(q.toLowerCase())) ||
          (coordStr && coordStr.toLowerCase().includes(q.toLowerCase()))
        ) : true;
        const mts = tipo_suelo ? l.tipo_suelo === tipo_suelo : true;
        return mq && mts;
      });
      const total = filtered.length;
      const pageNum = parseInt(page) || 1;
      const lim = parseInt(limit) || 12;
      const start = (pageNum - 1) * lim;
      const rows = filtered.slice(start, start + lim);
      res.json({ ok: true, data: rows, pagination: { total, page: pageNum, pages: Math.ceil(total / lim), limit: lim } });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  },
  async apiLotesMetrics(req, res) {
    try {
      const lotes = await Lote.findAllByFinca(req.params.id_finca) || [];
      if (!lotes.length) return res.json({ ok: true, metrics: { total: 0, areaTotal: 0, phPromedio: 0 } });
      const areaTotal = lotes.reduce((acc, l) => acc + (parseFloat(l.area) || 0), 0);
      const phVals = lotes.map(l => parseFloat(l.ph_suelo)).filter(n => !isNaN(n));
      const phPromedio = phVals.length ? +(phVals.reduce((a,b)=>a+b,0)/phVals.length).toFixed(2) : 0;
      res.json({ ok: true, metrics: { total: lotes.length, areaTotal, phPromedio } });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  },
  // API ZONAS
  async apiListZonas(req, res) {
    try {
      const zonas = await Zona.findAll();
      res.json({ ok: true, data: zonas });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  }
};

module.exports = gestionFincaController;

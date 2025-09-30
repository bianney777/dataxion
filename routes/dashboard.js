// routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Add authentication middleware here later
router.get('/data', dashboardController.getDashboardData);

module.exports = router;
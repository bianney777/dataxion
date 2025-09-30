// controllers/dashboardController.js
const dashboardController = {
  getDashboardData(req, res) {
    // This is a protected route that provides dashboard information
    res.json({ 
      message: 'Bienvenido al Dashboard',
      user: req.user, // This comes from the authentication middleware
      services: [
        { id: 1, name: 'Servicio 1', description: 'Descripción del servicio 1' },
        { id: 2, name: 'Servicio 2', description: 'Descripción del servicio 2' }
      ],
      stats: {
        totalUsers: 150,
        activeServices: 5,
        monthlyRevenue: 2500
      }
    });
  }
};

module.exports = dashboardController;
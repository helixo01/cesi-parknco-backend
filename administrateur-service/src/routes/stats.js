const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Toutes les routes nécessitent une authentification
router.use(auth);
router.use(adminAuth.techAdmin); // Seuls les admins techniques peuvent accéder aux statistiques

// GET /api/stats/global - Obtenir les statistiques globales
router.get('/global', statsController.getGlobalStats);

// GET /api/stats/occupancy - Obtenir les statistiques d'occupation
router.get('/occupancy', statsController.getOccupancyStats);

// GET /api/stats/revenue - Obtenir les statistiques de revenus
router.get('/revenue', statsController.getRevenueStats);

// GET /api/stats/sensors - Obtenir les statistiques des capteurs
router.get('/sensors', statsController.getSensorStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// GET /api/stats/parkings - Statistiques des parkings
router.get('/parkings', statsController.getParkingStats);

// GET /api/stats/reservations - Statistiques des réservations
router.get('/reservations', statsController.getReservationStats);

// GET /api/stats/occupancy - Statistiques d'occupation
router.get('/occupancy', statsController.getOccupancyStats);

// GET /api/stats/revenue - Statistiques des revenus
router.get('/revenue', statsController.getRevenueStats);

// Route pour les statistiques utilisateur
router.get('/users/:userId', statsController.getUserStats);

// Route pour obtenir tous les utilisateurs avec pagination
router.get('/users', auth, statsController.getAllUsersStats);

module.exports = router;

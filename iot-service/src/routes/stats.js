const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// GET /api/stats/sensors - Statistiques des capteurs
router.get('/sensors', statsController.getSensorStats);

module.exports = router;

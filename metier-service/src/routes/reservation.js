const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const reservationController = require('../controllers/reservationController');
const auth = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// GET /api/reservations - Obtenir les réservations de l'utilisateur
router.get('/', reservationController.getUserReservations);

// GET /api/reservations/:id - Obtenir une réservation par ID
router.get('/:id', reservationController.getReservationById);

// POST /api/reservations - Créer une nouvelle réservation
router.post('/', [
  check('parkingId', 'ID du parking invalide').isMongoId(),
  check('spaceNumber', 'Numéro de place requis').notEmpty(),
  check('startTime', 'Date de début invalide').isISO8601(),
  check('endTime', 'Date de fin invalide').isISO8601(),
  check('vehicleInfo.plate', 'Plaque d\'immatriculation requise').notEmpty(),
  check('vehicleInfo.type', 'Type de véhicule invalide').isIn(['car', 'motorcycle', 'electric'])
], reservationController.createReservation);

// PUT /api/reservations/:id/cancel - Annuler une réservation
router.put('/:id/cancel', reservationController.cancelReservation);

module.exports = router;

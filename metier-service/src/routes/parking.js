const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const parkingController = require('../controllers/parkingController');

// GET /api/parkings - Obtenir tous les parkings
router.get('/', parkingController.getAllParkings);

// GET /api/parkings/:id - Obtenir un parking par ID
router.get('/:id', parkingController.getParkingById);

// POST /api/parkings - Créer un nouveau parking
router.post('/', [
  check('name', 'Le nom est requis').notEmpty(),
  check('totalSpaces', 'Le nombre total de places est requis').isInt({ min: 1 }),
  check('pricePerHour', 'Le prix horaire est requis').isFloat({ min: 0 })
], parkingController.createParking);

// PUT /api/parkings/:id - Mettre à jour un parking
router.put('/:id', [
  check('name', 'Le nom est requis').optional().notEmpty(),
  check('totalSpaces', 'Le nombre total de places doit être positif').optional().isInt({ min: 1 }),
  check('pricePerHour', 'Le prix horaire doit être positif').optional().isFloat({ min: 0 })
], parkingController.updateParking);

// PATCH /api/parkings/:id/space - Mettre à jour le statut d'une place
router.patch('/:id/space', [
  check('spaceNumber', 'Le numéro de place est requis').notEmpty(),
  check('isOccupied', 'Le statut d\'occupation est requis').isBoolean()
], parkingController.updateSpaceStatus);

module.exports = router;

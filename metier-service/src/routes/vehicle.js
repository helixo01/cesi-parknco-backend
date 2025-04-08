const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// GET /api/vehicles - Récupérer tous les véhicules de l'utilisateur
router.get('/', vehicleController.getUserVehicles);

// POST /api/vehicles - Créer un nouveau véhicule
router.post('/', [
  check('type', 'Le type de véhicule est requis').isIn(['électrique', 'diesel', 'essence', 'hybride']),
  check('seats', 'Le nombre de places doit être entre 1 et 4').isInt({ min: 1, max: 4 }),
  check('name', 'Le nom du véhicule est requis').notEmpty()
], vehicleController.createVehicle);

// PUT /api/vehicles/:id - Mettre à jour un véhicule
router.put('/:id', [
  check('type', 'Le type de véhicule est requis').isIn(['électrique', 'diesel', 'essence', 'hybride']),
  check('seats', 'Le nombre de places doit être entre 1 et 4').isInt({ min: 1, max: 4 }),
  check('name', 'Le nom du véhicule est requis').notEmpty()
], vehicleController.updateVehicle);

// DELETE /api/vehicles/:id - Supprimer un véhicule
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const sensorController = require('../controllers/sensorController');
const auth = require('../middleware/auth');

// Middleware d'authentification pour les routes protégées
router.use(auth);

// POST /api/sensors/register - Enregistrer un nouveau capteur
router.post('/register', [
  check('sensorId', 'ID du capteur requis').notEmpty(),
  check('type', 'Type de capteur invalide').isIn(['presence', 'temperature', 'humidity']),
  check('location.parkingId', 'ID du parking requis').notEmpty()
], sensorController.registerSensor);

// POST /api/sensors/data - Recevoir des données d'un capteur
router.post('/data', [
  check('sensorId', 'ID du capteur requis').notEmpty(),
  check('type', 'Type de capteur requis').notEmpty(),
  check('value', 'Valeur requise').exists()
], sensorController.receiveSensorData);

// GET /api/sensors/:sensorId/status - Obtenir l'état d'un capteur
router.get('/:sensorId/status', sensorController.getSensorStatus);

// GET /api/sensors/:sensorId/history - Obtenir l'historique des données d'un capteur
router.get('/:sensorId/history', sensorController.getSensorHistory);

// PATCH /api/sensors/:sensorId/status - Mettre à jour le statut d'un capteur
router.patch('/:sensorId/status', [
  check('status', 'Statut invalide').isIn(['active', 'inactive', 'maintenance', 'error'])
], sensorController.updateSensorStatus);

module.exports = router;

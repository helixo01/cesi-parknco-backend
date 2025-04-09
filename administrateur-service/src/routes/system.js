const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const systemController = require('../controllers/systemController');
const auth = require('../middleware/auth');
const { techAdmin } = require('../middleware/adminAuth');

// Toutes les routes nécessitent une authentification admin technique
router.use(auth);
router.use(techAdmin);

// GET /api/system/config - Obtenir la configuration du système
router.get('/config', systemController.getConfig);

// PUT /api/system/config - Mettre à jour la configuration du système
router.put('/config', [
  check('key', 'Clé requise').notEmpty(),
  check('value', 'Valeur requise').exists(),
  check('category', 'Catégorie invalide').isIn(['security', 'payment', 'notification', 'maintenance', 'general'])
], systemController.updateConfig);

// GET /api/system/health - Vérifier la santé des services
router.get('/health', systemController.checkServicesHealth);

// GET /api/system/audit - Obtenir les logs d'audit
router.get('/audit', systemController.getAuditLogs);

// GET /api/system/stats - Obtenir les statistiques du système
router.get('/stats', systemController.getSystemStats);

module.exports = router;

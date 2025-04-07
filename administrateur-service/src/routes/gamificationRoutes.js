const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes protégées par authentification
router.get('/', authMiddleware, gamificationController.getConfig);
router.post('/', authMiddleware, gamificationController.createConfig);
router.put('/', authMiddleware, gamificationController.updateConfig);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// GET /api/users - Obtenir tous les utilisateurs (admin seulement)
router.get('/', adminAuth.userAdmin, userController.getAllUsers);

// GET /api/users/:userId - Obtenir un utilisateur par ID (admin seulement)
router.get('/:userId', adminAuth.userAdmin, userController.getUserById);

// PATCH /api/users/:userId/role - Mettre à jour le rôle d'un utilisateur (admin seulement)
router.patch('/:userId/role', [
  adminAuth.userAdmin,
  check('role', 'Rôle invalide').isIn(['user', 'admin_user', 'admin_tech'])
], userController.updateUserRole);

// PATCH /api/users/:userId/status - Mettre à jour le statut d'un utilisateur (admin seulement)
router.patch('/:userId/status', [
  adminAuth.userAdmin,
  check('active', 'Le statut doit être un booléen').isBoolean()
], userController.updateUserStatus);

module.exports = router;

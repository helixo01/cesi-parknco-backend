const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// POST /api/auth/register - Inscription
router.post('/register', [
  check('email', 'Email invalide').isEmail(),
  check('password', 'Le mot de passe doit contenir au moins 6 caractères').isLength({ min: 6 }),
  check('firstName', 'Le prénom est requis').notEmpty(),
  check('lastName', 'Le nom est requis').notEmpty()
], authController.register);

// POST /api/auth/login - Connexion
router.post('/login', [
  check('email', 'Email invalide').isEmail(),
  check('password', 'Le mot de passe est requis').exists()
], authController.login);

// GET /api/auth/verify - Vérifier un token
router.get('/verify', authController.verifyToken);

// GET /api/auth/me - Obtenir les informations de l'utilisateur connecté
router.get('/me', auth, authController.getMe);

// PUT /api/auth/me - Mettre à jour les informations de l'utilisateur connecté
router.put('/me', [
  auth,
  check('firstName', 'Le prénom est requis').optional().notEmpty(),
  check('lastName', 'Le nom est requis').optional().notEmpty(),
  check('email', 'Email invalide').optional().isEmail(),
  check('formation', 'Formation invalide').optional().isIn(['À définir', 'personnel', 'master', 'cpi', 'fise', 'fisa']),
  check('specialite', 'Spécialité invalide').optional().isIn(['À définir', 'informatique', 'btp', 'generaliste']),
  check('year', 'Année invalide').optional().isIn(['À définir', '1', '2', '3', '4', '5'])
], authController.updateMe);

// POST /api/auth/profile-picture - Mettre à jour la photo de profil
router.post('/profile-picture', auth, authController.updateProfilePicture);

// GET /api/auth/stats - Obtenir les statistiques utilisateurs (admin seulement)
router.get('/stats', auth, adminAuth.userAdmin, authController.getUserStats);

module.exports = router;

const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Inscription
router.post(
  '/register',
  [
    // Validation des données d'inscription
    check('email', 'Veuillez entrer un email valide').isEmail(),
    check('password', 'Le mot de passe doit contenir au moins 6 caractères').isLength({ min: 6 }),
    check('firstName', 'Le prénom est requis').not().isEmpty(),
    check('lastName', 'Le nom est requis').not().isEmpty()
  ],
  authController.register // Appelle la fonction register du contrôleur
);

// Connexion
router.post(
  '/login',
  [
    // Validation des données de connexion
    check('email', 'Veuillez entrer un email valide').isEmail(),
    check('password', 'Le mot de passe est requis').exists()
  ],
  authController.login // Appelle la fonction login du contrôleur
);

// Profil utilisateur
router.get('/me', auth, authController.getMe);

module.exports = router;

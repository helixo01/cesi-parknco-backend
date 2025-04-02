const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Vérifier un token
exports.verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur lors de la vérification du token:', err);
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    const { email, password, firstName, lastName } = req.body;

    // Validation des données
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        message: 'Tous les champs sont requis',
        details: {
          email: !email ? 'Email requis' : null,
          password: !password ? 'Mot de passe requis' : null,
          firstName: !firstName ? 'Prénom requis' : null,
          lastName: !lastName ? 'Nom requis' : null
        }
      });
    }

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer un nouvel utilisateur
    user = new User({
      email,
      password, // Le mot de passe sera hashé automatiquement par le middleware pre-save
      firstName,
      lastName,
      role: 'user',
      active: true
    });

    // Sauvegarder l'utilisateur
    await user.save();
    console.log('Utilisateur créé:', user);

    // Créer et renvoyer le token JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
    res.status(500).json({ 
      message: 'Erreur lors de l\'inscription',
      error: err.message 
    });
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    console.log('Données reçues:', req.body);
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({
        message: 'Tous les champs sont requis',
        details: {
          email: !email ? 'Email requis' : null,
          password: !password ? 'Mot de passe requis' : null
        }
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // Vérifier si le compte est actif
    if (!user.active) {
      return res.status(403).json({ message: 'Ce compte a été désactivé' });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    // Mettre à jour la date de dernière connexion
    user.lastLogin = new Date();
    await user.save();
    console.log('Utilisateur connecté:', user);

    // Créer et renvoyer le token JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la connexion',
      error: err.message 
    });
  }
};

// Obtenir les informations de l'utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Structure la réponse pour correspondre au frontend
    const userData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
    
    console.log('Informations de l\'utilisateur:', userData);
    res.json(userData);
  } catch (err) {
    console.error('Erreur lors de la récupération des informations de l\'utilisateur:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des informations de l\'utilisateur',
      error: err.message 
    });
  }
};

// Obtenir les statistiques des utilisateurs
exports.getUserStats = async (req, res) => {
  try {
    const users = await User.find();
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: users.length,
      active: users.filter(u => u.active).length,
      inactive: users.filter(u => !u.active).length,
      roles: {
        user: users.filter(u => u.role === 'user').length,
        admin_user: users.filter(u => u.role === 'admin_user').length,
        admin_tech: users.filter(u => u.role === 'admin_tech').length
      },
      recentlyActive: users.filter(u => u.lastLogin && u.lastLogin >= lastWeek).length
    };

    console.log('Statistiques des utilisateurs:', stats);
    res.json(stats);
  } catch (err) {
    console.error('Erreur lors de la récupération des statistiques utilisateurs:', err);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des statistiques utilisateurs',
      error: err.message 
    });
  }
};

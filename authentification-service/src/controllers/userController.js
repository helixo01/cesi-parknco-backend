const User = require('../models/User');
const { validationResult } = require('express-validator');

// Obtenir la liste des utilisateurs (admin seulement)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir un utilisateur par ID (admin seulement)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le rôle d'un utilisateur (admin seulement)
exports.updateUserRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { role } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que le rôle est valide
    const validRoles = ['user', 'admin_user', 'admin_tech'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    res.json({ 
      message: 'Rôle mis à jour avec succès',
      oldRole,
      newRole: role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut d'un utilisateur (admin seulement)
exports.updateUserStatus = async (req, res) => {
  try {
    const { active } = req.body;
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    user.active = active;
    await user.save();

    res.json({ 
      message: `Utilisateur ${active ? 'activé' : 'désactivé'} avec succès`,
      userId: user._id,
      active: user.active
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

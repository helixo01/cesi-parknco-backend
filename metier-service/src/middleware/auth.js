const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant' });
    }

    // Extraire le token du format "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Format de token invalide' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // S'assurer que toutes les informations nécessaires sont présentes
    if (!decoded.user || !decoded.user.id) {
      return res.status(401).json({ message: 'Token invalide - informations utilisateur manquantes' });
    }

    // Vérifier si l'utilisateur existe dans la base de données du service métier
    let user = await User.findById(decoded.user.id);
    
    if (!user) {
      // Si l'utilisateur n'existe pas, le créer avec les informations du token
      user = new User({
        _id: decoded.user.id,
        firstName: decoded.user.firstName,
        lastName: decoded.user.lastName,
        email: decoded.user.email,
        profilePicture: decoded.user.profilePicture,
        rating: decoded.user.rating
      });
      await user.save();
      console.log('Nouvel utilisateur créé dans le service métier:', user);
    } else {
      // Mettre à jour les informations de l'utilisateur avec celles du token
      const updateData = {
        firstName: decoded.user.firstName,
        lastName: decoded.user.lastName,
        email: decoded.user.email,
        profilePicture: decoded.user.profilePicture,
        rating: decoded.user.rating
      };

      // Ne mettre à jour que si les données ont changé
      if (JSON.stringify(user.toObject()) !== JSON.stringify({ ...user.toObject(), ...updateData })) {
        Object.assign(user, updateData);
        await user.save();
        console.log('Informations utilisateur mises à jour dans le service métier:', user);
      }
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: decoded.user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      rating: user.rating
    };

    next();
  } catch (err) {
    console.error('Erreur de vérification du token:', err);
    res.status(401).json({ message: 'Token invalide' });
  }
};

const User = require('../models/User');

exports.getPublicUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Recherche de l\'utilisateur avec ID:', userId);

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('ID utilisateur invalide:', userId);
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    const user = await User.findById(userId).select('firstName lastName profilePicture');
    console.log('Utilisateur trouvé:', user);

    if (!user) {
      console.log('Utilisateur non trouvé pour l\'ID:', userId);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const publicInfo = {
      firstName: user.firstName || 'Utilisateur',
      lastName: user.lastName || '',
      profilePicture: user.profilePicture || null
    };

    console.log('Informations publiques renvoyées:', publicInfo);
    res.json(publicInfo);
  } catch (err) {
    console.error('Erreur détaillée lors de la récupération des informations utilisateur:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération des informations utilisateur',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}; 
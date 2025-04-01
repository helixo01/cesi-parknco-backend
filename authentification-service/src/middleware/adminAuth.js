module.exports = {
  // Middleware pour vérifier les droits d'admin utilisateur
  userAdmin: (req, res, next) => {
    if (!req.user || (req.user.role !== 'admin_user' && req.user.role !== 'admin_tech')) {
      return res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' });
    }
    next();
  },

  // Middleware pour vérifier les droits d'admin technique
  techAdmin: (req, res, next) => {
    if (!req.user || req.user.role !== 'admin_tech') {
      return res.status(403).json({ message: 'Accès refusé. Droits administrateur technique requis.' });
    }
    next();
  }
};

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Récupérer le token du header Authorization
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant' });
  }

  try {
    // Extraire le token du format "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Format de token invalide' });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Erreur de vérification du token:', err);
    res.status(401).json({ message: 'Token invalide' });
  }
};

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Récupérer le token du header
  const token = req.header('x-auth-token');

  // Vérifier si le token existe
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant' });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

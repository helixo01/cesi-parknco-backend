const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Récupérer le token du cookie
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant' });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Erreur de vérification du token:', err);
    res.status(401).json({ message: 'Token invalide' });
  }
};

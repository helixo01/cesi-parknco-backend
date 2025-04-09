const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  let token;
  
  // Récupérer le token du cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } 
  // Sinon essayer de le récupérer du header Authorization
  else {
    const authHeader = req.header('Authorization');
    if (authHeader) {
      // Extraire le token du format "Bearer <token>"
      token = authHeader.split(' ')[1];
    }
  }
  
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

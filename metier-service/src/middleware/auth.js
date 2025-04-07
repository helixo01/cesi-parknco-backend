const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  let token;
  
  console.log('Cookies reçus:', req.cookies);
  console.log('Headers reçus:', req.headers);
  
  // Récupérer le token du cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('Token trouvé dans les cookies');
  } 
  // Sinon essayer de le récupérer du header Authorization
  else {
    const authHeader = req.header('Authorization');
    if (authHeader) {
      // Extraire le token du format "Bearer <token>"
      token = authHeader.split(' ')[1];
      console.log('Token trouvé dans le header Authorization');
    }
  }
  
  if (!token) {
    console.log('Aucun token trouvé');
    return res.status(401).json({ 
      message: 'Accès refusé. Token manquant',
      details: 'Veuillez vous reconnecter'
    });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token vérifié avec succès:', decoded);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('Erreur de vérification du token:', err);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Session expirée',
        details: 'Veuillez vous reconnecter'
      });
    }
    res.status(401).json({ 
      message: 'Token invalide',
      details: 'Veuillez vous reconnecter'
    });
  }
};

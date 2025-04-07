const jwt = require('jsonwebtoken');
const axios = require('axios');

module.exports = async (req, res, next) => {
  try {
    // Autoriser les requêtes du service métier
    const serviceHeader = req.headers['x-service-name'];
    if (serviceHeader === 'metier-service') {
      return next();
    }

    // Récupérer le token depuis les cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Vérifier le token avec le service d'authentification
    const response = await axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: {
        Cookie: `token=${token}`
      }
    });

    const { user } = response.data;

    // Vérifier si l'utilisateur est un administrateur
    if (user.role !== 'admin_user') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Ajouter les informations de l'utilisateur à la requête
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    return res.status(401).json({ message: 'Authentication failed' });
  }
}; 
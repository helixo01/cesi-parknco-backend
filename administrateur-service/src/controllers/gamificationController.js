const Gamification = require('../models/Gamification');

// Récupérer la configuration actuelle
exports.getConfig = async (req, res) => {
  try {
    const config = await Gamification.getDefaultConfig();
    res.json(config);
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la configuration' });
  }
};

// Mettre à jour la configuration
exports.updateConfig = async (req, res) => {
  try {
    const config = await Gamification.getDefaultConfig();
    
    // Mettre à jour uniquement les champs fournis
    Object.keys(req.body).forEach(key => {
      if (config.schema.paths[key]) {
        config[key] = req.body[key];
      }
    });

    await config.save();
    res.json(config);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la configuration:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la configuration' });
  }
};

// Créer une nouvelle configuration
exports.createConfig = async (req, res) => {
  try {
    const newConfig = new Gamification(req.body);
    await newConfig.save();
    res.status(201).json(newConfig);
  } catch (error) {
    console.error('Erreur lors de la création de la configuration:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la configuration' });
  }
}; 
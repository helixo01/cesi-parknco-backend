const Gamification = require('../models/Gamification');

// Récupérer la configuration actuelle
exports.getConfig = async (req, res) => {
  try {
    const config = await Gamification.findOne().sort({ createdAt: -1 });
    if (!config) {
      // Si aucune configuration n'existe, créer une configuration par défaut
      const defaultConfig = new Gamification();
      await defaultConfig.save();
      return res.json(defaultConfig);
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour la configuration
exports.updateConfig = async (req, res) => {
  try {
    const config = await Gamification.findOne().sort({ createdAt: -1 });
    if (!config) {
      // Si aucune configuration n'existe, créer une nouvelle configuration
      const newConfig = new Gamification(req.body);
      await newConfig.save();
      return res.json(newConfig);
    }

    // Mettre à jour la configuration existante
    Object.assign(config, req.body);
    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer une nouvelle configuration
exports.createConfig = async (req, res) => {
  try {
    const newConfig = new Gamification(req.body);
    await newConfig.save();
    res.status(201).json(newConfig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 
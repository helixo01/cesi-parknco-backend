const Vehicle = require('../models/Vehicle');

// Obtenir tous les véhicules d'un utilisateur
exports.getUserVehicles = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const vehicles = await Vehicle.find({ userId }).sort({ createdAt: -1 });
    
    res.json(vehicles);
  } catch (err) {
    console.error('Erreur lors de la récupération des véhicules:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération des véhicules',
      error: err.message
    });
  }
};

// Créer un nouveau véhicule
exports.createVehicle = async (req, res) => {
  try {
    const { type, seats, name } = req.body;
    const userId = req.user.id;

    // Vérifier si les places respectent la limite (max 4)
    if (seats > 4) {
      return res.status(400).json({ 
        message: 'Le nombre de places ne peut pas dépasser 4' 
      });
    }

    const vehicle = new Vehicle({
      userId,
      type,
      seats,
      name
    });

    await vehicle.save();

    res.status(201).json({
      message: 'Véhicule ajouté avec succès',
      vehicle
    });
  } catch (err) {
    console.error('Erreur lors de la création du véhicule:', err);
    res.status(500).json({
      message: 'Erreur lors de la création du véhicule',
      error: err.message
    });
  }
};

// Mettre à jour un véhicule
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, seats, name } = req.body;
    const userId = req.user.id;

    // Vérifier si les places respectent la limite (max 4)
    if (seats > 4) {
      return res.status(400).json({ 
        message: 'Le nombre de places ne peut pas dépasser 4' 
      });
    }

    // Vérifier que l'utilisateur est propriétaire du véhicule
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    if (vehicle.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce véhicule' });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      { type, seats, name },
      { new: true }
    );

    res.json({
      message: 'Véhicule mis à jour avec succès',
      vehicle: updatedVehicle
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour du véhicule:', err);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du véhicule',
      error: err.message
    });
  }
};

// Supprimer un véhicule
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur est propriétaire du véhicule
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    if (vehicle.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce véhicule' });
    }

    await Vehicle.findByIdAndDelete(id);

    res.json({ message: 'Véhicule supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression du véhicule:', err);
    res.status(500).json({
      message: 'Erreur lors de la suppression du véhicule',
      error: err.message
    });
  }
}; 
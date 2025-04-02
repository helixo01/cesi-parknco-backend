const Trip = require('../models/Trip');

// Créer un nouveau trajet
exports.createTrip = async (req, res) => {
  try {
    const { departure, arrival, date, time, availableSeats, price, vehicle } = req.body;
    const userId = req.user.id; // Obtenu depuis le middleware d'authentification

    const trip = new Trip({
      userId,
      departure,
      arrival,
      date,
      time,
      availableSeats,
      price,
      vehicle
    });

    await trip.save();
    console.log('Nouveau trajet créé:', trip);

    res.status(201).json({
      message: 'Trajet créé avec succès',
      trip
    });
  } catch (err) {
    console.error('Erreur lors de la création du trajet:', err);
    res.status(500).json({
      message: 'Erreur lors de la création du trajet',
      error: err.message
    });
  }
};

// Récupérer tous les trajets
exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ date: 1, time: 1 });
    res.json(trips);
  } catch (err) {
    console.error('Erreur lors de la récupération des trajets:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération des trajets',
      error: err.message
    });
  }
};

// Récupérer un trajet par son ID
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }
    res.json(trip);
  } catch (err) {
    console.error('Erreur lors de la récupération du trajet:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération du trajet',
      error: err.message
    });
  }
};

// Mettre à jour un trajet
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est le propriétaire du trajet
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé à modifier ce trajet' });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json({
      message: 'Trajet mis à jour avec succès',
      trip: updatedTrip
    });
  } catch (err) {
    console.error('Erreur lors de la mise à jour du trajet:', err);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour du trajet',
      error: err.message
    });
  }
};

// Supprimer un trajet
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est le propriétaire du trajet
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé à supprimer ce trajet' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trajet supprimé avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression du trajet:', err);
    res.status(500).json({
      message: 'Erreur lors de la suppression du trajet',
      error: err.message
    });
  }
};
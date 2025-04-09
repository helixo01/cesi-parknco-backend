const Trip = require('../models/Trip');
const TripConfirmation = require('../models/TripConfirmation');

// Conducteur confirme avoir pris en charge les passagers
exports.confirmAsDriver = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { isConfirmed } = req.body;
    const userId = req.user.id;

    console.log('Tentative de confirmation conducteur:', { tripId, userId, isConfirmed });

    // Vérifier que le trajet existe
    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.log('Trajet non trouvé:', tripId);
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est le conducteur
    if (trip.userId.toString() !== userId) {
      console.log('Utilisateur non conducteur:', { tripUserId: trip.userId, userId });
      return res.status(403).json({ message: 'Vous n\'êtes pas le conducteur de ce trajet' });
    }

    // Vérifier si une confirmation existe déjà
    const existingConfirmation = await TripConfirmation.findOne({
      tripId,
      userId,
      role: 'driver'
    });

    if (existingConfirmation) {
      console.log('Confirmation conducteur existante:', existingConfirmation);
      return res.status(400).json({ message: 'Vous avez déjà confirmé la prise en charge' });
    }

    // Créer la confirmation
    const confirmation = new TripConfirmation({
      tripId,
      userId,
      role: 'driver',
      isConfirmed
    });

    await confirmation.save();
    console.log('Confirmation conducteur enregistrée:', confirmation);

    // Mettre à jour le statut du trajet
    trip.status = 'completed';
    trip.completedAt = new Date();
    await trip.save();

    res.json({
      message: 'Prise en charge confirmée avec succès',
      confirmation
    });
  } catch (err) {
    console.error('Erreur lors de la confirmation conducteur:', err);
    res.status(500).json({
      message: 'Erreur lors de la confirmation',
      error: err.message
    });
  }
};

// Passager confirme avoir été pris en charge
exports.confirmAsPassenger = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { isConfirmed } = req.body;
    const userId = req.user.id;

    console.log('Tentative de confirmation passager:', { tripId, userId, isConfirmed });

    // Vérifier que le trajet existe
    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.log('Trajet non trouvé:', tripId);
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est un passager accepté
    const passengerRequest = trip.requests.find(
      request => request.userId.toString() === userId && 
      request.status === 'accepted'
    );

    if (!passengerRequest) {
      console.log('Utilisateur non passager:', { userId, requests: trip.requests });
      return res.status(403).json({ message: 'Vous n\'êtes pas un passager de ce trajet' });
    }

    // Vérifier si une confirmation existe déjà
    const existingConfirmation = await TripConfirmation.findOne({
      tripId,
      userId,
      role: 'passenger'
    });

    if (existingConfirmation) {
      console.log('Confirmation passager existante:', existingConfirmation);
      return res.status(400).json({ message: 'Vous avez déjà confirmé la prise en charge' });
    }

    // Créer la confirmation
    const confirmation = new TripConfirmation({
      tripId,
      userId,
      role: 'passenger',
      isConfirmed
    });

    await confirmation.save();
    console.log('Confirmation passager enregistrée:', confirmation);

    // Vérifier si tous les passagers acceptés ont confirmé
    const acceptedPassengers = trip.requests.filter(request => request.status === 'accepted');
    const confirmedPassengers = await TripConfirmation.find({
      tripId,
      role: 'passenger'
    });

    // Vérifier si le conducteur a confirmé
    const driverConfirmation = await TripConfirmation.findOne({
      tripId,
      role: 'driver'
    });

    // Si tous les passagers et le conducteur ont confirmé, marquer le trajet comme complété
    if (driverConfirmation && confirmedPassengers.length === acceptedPassengers.length) {
      trip.status = 'completed';
      trip.completedAt = new Date();
      await trip.save();
    }

    res.json({
      message: 'Prise en charge confirmée avec succès',
      confirmation
    });
  } catch (err) {
    console.error('Erreur lors de la confirmation passager:', err);
    res.status(500).json({
      message: 'Erreur lors de la confirmation',
      error: err.message
    });
  }
}; 
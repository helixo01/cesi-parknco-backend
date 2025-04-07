const Trip = require('../models/Trip');
const Rating = require('../models/Rating');
const User = require('../models/User');
const TripConfirmation = require('../models/TripConfirmation');

// Passager note le conducteur
exports.completeAsPassenger = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { rating, isConfirmed } = req.body;
    const userId = req.user.id;

    console.log('Tentative de notation par un passager:', { tripId, userId, rating, isConfirmed });

    // Vérifier que le trajet existe
    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.log('Trajet non trouvé:', tripId);
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est bien un passager accepté pour ce trajet
    const userRequest = trip.requests.find(
      request => request.userId.toString() === userId && 
      request.status === 'accepted'
    );

    console.log('Requête utilisateur trouvée:', userRequest);
    if (!userRequest) {
      return res.status(403).json({ message: 'Vous n\'êtes pas un passager de ce trajet' });
    }

    // Si isConfirmed est true, créer ou mettre à jour la confirmation
    if (isConfirmed) {
      const existingConfirmation = await TripConfirmation.findOne({
        tripId,
        userId,
        role: 'passenger'
      });

      if (!existingConfirmation) {
        const newConfirmation = new TripConfirmation({
          tripId,
          userId,
          role: 'passenger',
          isConfirmed: true
        });
        await newConfirmation.save();
      }
    }

    // Vérifier si le passager a déjà noté ce trajet
    const existingRating = await Rating.findOne({
      tripId,
      fromUserId: userId,
      toUserId: trip.userId,
      role: 'passenger'
    });

    console.log('Note existante:', existingRating);
    if (existingRating) {
      return res.status(400).json({ message: 'Vous avez déjà noté ce trajet' });
    }

    // Récupérer les informations des utilisateurs
    const [fromUser, toUser] = await Promise.all([
      User.findById(userId),
      User.findById(trip.userId)
    ]);

    // Créer la note
    const newRating = new Rating({
      tripId,
      fromUserId: userId,
      fromUserName: fromUser ? {
        firstName: fromUser.firstName,
        lastName: fromUser.lastName
      } : {},
      toUserId: trip.userId,
      toUserName: toUser ? {
        firstName: toUser.firstName,
        lastName: toUser.lastName
      } : {},
      rating,
      role: 'passenger'
    });

    await newRating.save();
    console.log('Note sauvegardée avec succès');

    // Mettre à jour la note moyenne du conducteur
    const driverRatings = await Rating.find({
      toUserId: trip.userId,
      role: 'passenger'
    });

    const averageRating = driverRatings.length > 0 
      ? driverRatings.reduce((acc, curr) => acc + curr.rating, 0) / driverRatings.length 
      : rating;

    await User.findByIdAndUpdate(trip.userId, {
      $set: { driverRating: averageRating }
    });

    // Vérifier si toutes les confirmations sont faites pour mettre à jour le statut du trajet
    const allConfirmations = await TripConfirmation.find({ tripId });
    const passengerConfirmations = allConfirmations.filter(c => c.role === 'passenger');
    const driverConfirmation = allConfirmations.find(c => c.role === 'driver');

    const acceptedPassengers = trip.requests.filter(r => r.status === 'accepted');
    
    if (driverConfirmation && passengerConfirmations.length === acceptedPassengers.length) {
      trip.status = 'completed';
      await trip.save();
    }

    res.json({
      message: 'Note enregistrée avec succès',
      rating: newRating,
      averageRating
    });
  } catch (err) {
    console.error('Erreur détaillée lors de la notation:', err);
    res.status(500).json({
      message: 'Erreur lors de la notation',
      error: err.message
    });
  }
};

// Conducteur note un passager
exports.completeAsDriver = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { passengerId, rating, isConfirmed } = req.body;
    const userId = req.user.id;

    console.log('Tentative de notation par un conducteur:', { tripId, userId, passengerId, rating, isConfirmed });

    // Vérifier que le trajet existe
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est le conducteur
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas le conducteur de ce trajet' });
    }

    // Si isConfirmed est true, créer ou mettre à jour la confirmation
    if (isConfirmed) {
      const existingConfirmation = await TripConfirmation.findOne({
        tripId,
        userId,
        role: 'driver'
      });

      if (!existingConfirmation) {
        const newConfirmation = new TripConfirmation({
          tripId,
          userId,
          role: 'driver',
          isConfirmed: true
        });
        await newConfirmation.save();
      }
    }

    // Vérifier si le conducteur a déjà noté ce passager
    const existingRating = await Rating.findOne({
      tripId,
      fromUserId: userId,
      toUserId: passengerId,
      role: 'driver'
    });

    if (existingRating) {
      return res.status(400).json({ message: 'Vous avez déjà noté ce passager' });
    }

    // Récupérer les informations des utilisateurs
    const [fromUser, toUser] = await Promise.all([
      User.findById(userId),
      User.findById(passengerId)
    ]);

    // Créer la note
    const newRating = new Rating({
      tripId,
      fromUserId: userId,
      fromUserName: fromUser ? {
        firstName: fromUser.firstName,
        lastName: fromUser.lastName
      } : {},
      toUserId: passengerId,
      toUserName: toUser ? {
        firstName: toUser.firstName,
        lastName: toUser.lastName
      } : {},
      rating,
      role: 'driver'
    });

    await newRating.save();

    // Mettre à jour la note moyenne du passager
    const passengerRatings = await Rating.find({
      toUserId: passengerId,
      role: 'driver'
    });

    const averageRating = passengerRatings.length > 0 
      ? passengerRatings.reduce((acc, curr) => acc + curr.rating, 0) / passengerRatings.length 
      : rating;

    await User.findByIdAndUpdate(passengerId, {
      $set: { passengerRating: averageRating }
    });

    // Vérifier si toutes les confirmations sont faites pour mettre à jour le statut du trajet
    const allConfirmations = await TripConfirmation.find({ tripId });
    const passengerConfirmations = allConfirmations.filter(c => c.role === 'passenger');
    const driverConfirmation = allConfirmations.find(c => c.role === 'driver');

    const acceptedPassengers = trip.requests.filter(r => r.status === 'accepted');
    
    if (driverConfirmation && passengerConfirmations.length === acceptedPassengers.length) {
      trip.status = 'completed';
      await trip.save();
    }

    res.json({
      message: 'Note enregistrée avec succès',
      rating: newRating,
      averageRating
    });
  } catch (err) {
    console.error('Erreur détaillée lors de la notation:', err);
    res.status(500).json({
      message: 'Erreur lors de la notation',
      error: err.message
    });
  }
};

// Récupérer les notes d'un utilisateur
exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    // Récupérer toutes les notes reçues par l'utilisateur
    const ratings = await Rating.find({ toUserId: userId })
      .populate('fromUserId', 'firstName lastName')
      .populate('tripId', 'departure arrival date');

    // Récupérer le nombre de trajets confirmés
    const confirmedTripsAsDriver = await TripConfirmation.countDocuments({
      userId,
      role: 'driver'
    });

    const confirmedTripsAsPassenger = await TripConfirmation.countDocuments({
      userId,
      role: 'passenger'
    });

    // Calculer les statistiques
    const driverRatings = ratings.filter(r => r.role === 'passenger'); // Notes reçues en tant que conducteur
    const passengerRatings = ratings.filter(r => r.role === 'driver'); // Notes reçues en tant que passager

    const stats = {
      asDriver: {
        count: driverRatings.length,
        average: driverRatings.length > 0
          ? driverRatings.reduce((acc, curr) => acc + curr.rating, 0) / driverRatings.length
          : 0,
        confirmedTrips: confirmedTripsAsDriver
      },
      asPassenger: {
        count: passengerRatings.length,
        average: passengerRatings.length > 0
          ? passengerRatings.reduce((acc, curr) => acc + curr.rating, 0) / passengerRatings.length
          : 0,
        confirmedTrips: confirmedTripsAsPassenger
      }
    };

    res.json({
      ratings,
      stats
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des notes:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération des notes',
      error: err.message
    });
  }
}; 
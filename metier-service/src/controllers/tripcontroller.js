const Trip = require('../models/Trip');

// Créer un nouveau trajet
exports.createTrip = async (req, res) => {
  try {
    const { departure, arrival, date, time, availableSeats, vehicle, distance, duration, arrivalTime } = req.body;
    const userId = req.user.id;

    const trip = new Trip({
      userId,
      departure,
      arrival,
      date,
      time,
      availableSeats,
      vehicle,
      distance,
      duration,
      arrivalTime,
      userRole: 'driver' // Le créateur du trajet est automatiquement conducteur
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

// Récupérer les trajets de l'utilisateur connecté
exports.getMyTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();

    // Récupérer tous les trajets où l'utilisateur est conducteur ou passager accepté
    const allTrips = await Trip.find({
      $or: [
        { userId }, // Trajets où l'utilisateur est conducteur
        { 'requests': { 
          $elemMatch: { 
            userId, 
            status: 'accepted' 
          } 
        }} // Trajets où l'utilisateur est passager accepté
      ]
    }).sort({ date: 1, time: 1 });

    // Mettre à jour automatiquement le statut des trajets passés
    for (let trip of allTrips) {
      const tripDate = new Date(trip.date);
      const [arrivalHours, arrivalMinutes] = trip.arrivalTime.split(':').map(Number);
      tripDate.setHours(arrivalHours, arrivalMinutes, 0, 0);

      // Si l'heure d'arrivée est passée et que le trajet est toujours actif, 
      // le marquer comme terminé
      if (tripDate < currentDate && trip.status === 'active') {
        console.log(`Mise à jour du statut du trajet ${trip._id} de 'active' à 'completed'`);
        trip.status = 'completed';
        await trip.save();
      }
    }

    // Fonction pour déterminer le rôle de l'utilisateur et si une note est nécessaire
    const processTripData = async (trip) => {
      const tripObject = trip.toObject(); // Convertir en objet plain JS
      const isDriver = tripObject.userId.toString() === userId;
      const passengerRequest = tripObject.requests?.find(r => r.userId.toString() === userId && r.status === 'accepted');
      const userRole = isDriver ? 'driver' : (passengerRequest ? 'passenger' : null);

      // Récupérer les confirmations et ratings pour ce trajet
      const TripConfirmation = require('../models/TripConfirmation');
      const Rating = require('../models/Rating');

      const [confirmations, ratings] = await Promise.all([
        TripConfirmation.find({ tripId: tripObject._id }),
        Rating.find({ tripId: tripObject._id })
      ]);

      let needsRating = false;
      if (tripObject.status === 'completed' && userRole) {
        if (isDriver) {
          // Vérifier si le conducteur a déjà confirmé et noté
          const hasConfirmation = confirmations.some(
            c => c.userId.toString() === userId && c.role === 'driver' && c.isConfirmed
          );
          const hasGivenRating = ratings.some(
            r => r.fromUserId.toString() === userId && r.role === 'driver'
          );
          needsRating = !(hasConfirmation && hasGivenRating);
          console.log(`Trajet ${tripObject._id}: Conducteur nécessite une notation? ${needsRating}`);
          console.log('hasConfirmation:', hasConfirmation);
          console.log('hasGivenRating:', hasGivenRating);
        } else if (passengerRequest) {
          // Vérifier si le passager a déjà confirmé et noté
          const hasConfirmation = confirmations.some(
            c => c.userId.toString() === userId && c.role === 'passenger' && c.isConfirmed
          );
          const hasGivenRating = ratings.some(
            r => r.fromUserId.toString() === userId && r.role === 'passenger'
          );
          needsRating = !(hasConfirmation && hasGivenRating);
          console.log(`Trajet ${tripObject._id}: Passager nécessite une notation? ${needsRating}`);
          console.log('hasConfirmation:', hasConfirmation);
          console.log('hasGivenRating:', hasGivenRating);
        }
      }

      return {
        ...tripObject,
        userRole,
        needsRating,
        confirmations,
        ratings
      };
    };

    // Séparer les trajets actuels et historiques et ajouter les infos
    const currentTrips = await Promise.all(
      allTrips
        .filter(trip => {
          const tripDate = new Date(trip.date);
          const [arrivalHours, arrivalMinutes] = trip.arrivalTime.split(':').map(Number);
          tripDate.setHours(arrivalHours, arrivalMinutes, 0, 0);
          return tripDate >= currentDate && trip.status !== 'completed';
        })
        .map(processTripData)
    );

    const historicTrips = await Promise.all(
      allTrips
        .filter(trip => {
          const tripDate = new Date(trip.date);
          const [arrivalHours, arrivalMinutes] = trip.arrivalTime.split(':').map(Number);
          tripDate.setHours(arrivalHours, arrivalMinutes, 0, 0);
          return tripDate < currentDate || trip.status === 'completed';
        })
        .map(processTripData)
    );

    console.log('Trajets actuels:', currentTrips.length);
    console.log('Trajets historiques:', historicTrips.length);

    res.json({
      currentTrips,
      historicTrips
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des trajets:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération des trajets',
      error: err.message
    });
  }
};

// Créer une demande pour un trajet
exports.createTripRequest = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    // Vérifier si l'utilisateur est déjà en attente pour ce trajet
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    if (trip.requests.some(request => request.userId.toString() === userId)) {
      return res.status(400).json({ message: 'Une demande existe déjà pour ce trajet' });
    }

    // Vérifier si l'utilisateur est le propriétaire du trajet
    if (trip.userId.toString() === userId) {
      return res.status(400).json({ message: 'Impossible de postuler pour son propre trajet' });
    }

    // Ajouter la demande
    trip.requests.push({
      userId,
      status: 'pending',
      userRole: 'passenger' // Le demandeur est automatiquement passager
    });

    await trip.save();

    res.status(201).json({
      message: 'Demande créée avec succès',
      request: {
        userId,
        status: 'pending',
        createdAt: new Date(),
        userRole: 'passenger'
      }
    });
  } catch (err) {
    console.error('Erreur lors de la création de la demande:', err);
    res.status(500).json({
      message: 'Erreur lors de la création de la demande',
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

// Gérer une demande (accepter/rejeter)
exports.handleTripRequest = async (req, res) => {
  try {
    const { tripId, requestId } = req.params;
    const { action } = req.body;
    const userId = req.user.id;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est le propriétaire du trajet
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Non autorisé à gérer cette demande' });
    }

    // Trouver la demande
    const requestIndex = trip.requests.findIndex(r => r._id.toString() === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (action === 'accept') {
      // Si la demande est déjà acceptée, ne rien faire
      if (trip.requests[requestIndex].status === 'accepted') {
        return res.status(200).json({
          message: 'Cette demande est déjà acceptée',
          trip: {
            id: trip._id,
            availableSeats: trip.availableSeats,
            requests: trip.requests,
            status: trip.status
          }
        });
      }

      // Vérifier s'il reste des places disponibles
      if (trip.availableSeats <= 0) {
        return res.status(400).json({ message: 'Plus aucune place disponible' });
      }

      // Accepter la demande et décrémenter les places
      trip.requests[requestIndex].status = 'accepted';
      trip.availableSeats -= 1;

      // Si c'était la dernière place, marquer le trajet comme complet
      if (trip.availableSeats === 0) {
        trip.status = 'completed';
      }
    } else {
      // Pour un rejet
      const wasAccepted = trip.requests[requestIndex].status === 'accepted';
      trip.requests[requestIndex].status = 'rejected';

      // Si la demande était acceptée, réincrémenter les places
      if (wasAccepted) {
        trip.availableSeats += 1;
        if (trip.status === 'completed') {
          trip.status = 'active';
        }
      }
    }

    await trip.save();

    res.status(200).json({
      message: 'Demande gérée avec succès',
      trip: {
        id: trip._id,
        availableSeats: trip.availableSeats,
        requests: trip.requests,
        status: trip.status
      }
    });
  } catch (err) {
    console.error('Erreur lors de la gestion de la demande:', err);
    res.status(500).json({
      message: 'Erreur lors de la gestion de la demande',
      error: err.message
    });
  }
};

// Obtenir les demandes d'un utilisateur (en tant que conducteur ou passager)
exports.getUserTripRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query; // 'driver' ou 'passenger'

    let trips;
    if (role === 'driver') {
      // Obtenir les trajets créés par l'utilisateur avec leurs demandes
      trips = await Trip.find({ userId });
    } else if (role === 'passenger') {
      // Obtenir les trajets où l'utilisateur a postulé
      trips = await Trip.find({
        'requests.userId': userId
      }).select('_id departure arrival date time requests userId');

      // Filtrer pour ne garder que les demandes de l'utilisateur courant
      const formattedTrips = trips.map(trip => {
        const userRequest = trip.requests.find(req => req.userId.toString() === userId);
        if (!userRequest) return null;

        return {
          _id: trip._id,
          departure: trip.departure,
          arrival: trip.arrival,
          date: trip.date,
          time: trip.time,
          userId: trip.userId, // Include the driver's userId
          requests: [userRequest] // Ne garder que la demande de l'utilisateur
        };
      }).filter(trip => trip !== null);

      console.log('Demandes passager formatées:', JSON.stringify(formattedTrips, null, 2));
      return res.json(formattedTrips);
    } else {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    res.json(trips);
  } catch (err) {
    console.error('Erreur lors de la récupération des demandes:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération des demandes',
      error: err.message
    });
  }
};

// Récupérer les demandes d'un trajet spécifique
exports.getTripRequests = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    res.json({
      trip: {
        id: trip._id,
        departure: trip.departure,
        arrival: trip.arrival,
        date: trip.date,
        time: trip.time,
        availableSeats: trip.availableSeats,
        requests: trip.requests
      }
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des demandes:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération des demandes',
      error: err.message
    });
  }
};

// Rechercher des trajets
exports.searchTrips = async (req, res) => {
  try {
    const { departure, arrival, date, time } = req.query;
    const userId = req.user.id;

    // Créer la plage de dates pour la recherche
    const searchDate = new Date(date);
    const startDate = new Date(searchDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(searchDate);
    endDate.setHours(23, 59, 59, 999);

    console.log('Recherche de trajets avec:', { departure, arrival, date, time });
    console.log('Plage de dates:', { startDate, endDate });

    // Construire les critères de recherche
    const searchCriteria = {
      availableSeats: { $gt: 0 },
      departure: departure,
      arrival: arrival,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      // Ne pas inclure les trajets de l'utilisateur connecté
      userId: { $ne: userId }
    };

    console.log('Critères de recherche:', JSON.stringify(searchCriteria, null, 2));

    // Rechercher les trajets
    const trips = await Trip.find(searchCriteria)
      .select('departure arrival date time availableSeats vehicle distance duration arrivalTime userId requests status')
      .sort({ date: 1, time: 1 });

    // Filtrer les trajets où l'utilisateur n'a pas déjà fait une demande
    const filteredTrips = trips.filter(trip => {
      return !trip.requests.some(request => request.userId.toString() === userId);
    });

    console.log('Trajets trouvés:', filteredTrips.length);
    if (filteredTrips.length > 0) {
      console.log('Premier trajet trouvé:', JSON.stringify(filteredTrips[0], null, 2));
    }

    res.json(filteredTrips);
  } catch (err) {
    console.error('Erreur lors de la recherche des trajets:', err);
    res.status(500).json({
      message: 'Erreur lors de la recherche des trajets',
      error: err.message
    });
  }
};

// Récupérer les trajets terminés
exports.getCompletedTrips = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();

    // Récupérer les trajets où l'utilisateur est conducteur
    const asDriverTrips = await Trip.find({
      userId,
      date: { $lt: currentDate }
    }).sort({ date: -1 });

    // Récupérer les trajets où l'utilisateur est passager accepté
    const asPassengerTrips = await Trip.find({
      'requests': {
        $elemMatch: {
          userId,
          status: 'accepted'
        }
      },
      date: { $lt: currentDate }
    }).sort({ date: -1 });

    res.json({
      asDriver: asDriverTrips,
      asPassenger: asPassengerTrips
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des trajets terminés:', err);
    res.status(500).json({
      message: 'Erreur lors de la récupération des trajets terminés',
      error: err.message
    });
  }
};

// Confirmer la fin du trajet par le conducteur
exports.confirmPickup = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est le conducteur
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas le conducteur de ce trajet' });
    }

    // Vérifier que la date et l'heure du trajet sont passées
    const tripDateTime = new Date(trip.date);
    const [hours, minutes] = trip.time.split(':');
    tripDateTime.setHours(parseInt(hours), parseInt(minutes));
    
    const now = new Date();
    if (tripDateTime > now) {
      return res.status(400).json({ 
        message: 'Le trajet ne peut pas être confirmé avant sa date et heure prévues',
        tripDateTime,
        currentTime: now
      });
    }

    // Marquer tous les passagers acceptés comme pris en charge
    trip.requests.forEach(request => {
      if (request.status === 'accepted') {
        request.isPickedUp = true;
        request.pickedUpAt = new Date();
      }
    });

    // Mettre à jour le statut du trajet
    trip.allPassengersPickedUp = true;
    trip.status = 'completed';
    trip.completedAt = new Date();
    trip.isDriverConfirmed = true;
    trip.driverConfirmedAt = new Date();

    await trip.save();

    res.json({
      message: 'Trajet confirmé comme terminé',
      trip: {
        id: trip._id,
        status: trip.status,
        requests: trip.requests.filter(r => r.status === 'accepted'),
        completedAt: trip.completedAt
      }
    });
  } catch (err) {
    console.error('Erreur lors de la confirmation du trajet:', err);
    res.status(500).json({
      message: 'Erreur lors de la confirmation du trajet',
      error: err.message
    });
  }
};

// Confirmer la prise en charge par le passager
exports.confirmPickupAsPassenger = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est un passager accepté
    const request = trip.requests.find(r => 
      r.userId.toString() === userId && 
      r.status === 'accepted'
    );

    if (!request) {
      return res.status(403).json({ message: 'Vous n\'êtes pas un passager accepté pour ce trajet' });
    }

    // Vérifier que le conducteur a confirmé la prise en charge
    if (!request.isPickedUp) {
      return res.status(400).json({ message: 'Le conducteur n\'a pas encore confirmé votre prise en charge' });
    }

    // Confirmer la prise en charge
    request.pickupConfirmedByPassenger = true;
    request.pickupConfirmedByPassengerAt = new Date();

    // Vérifier si tous les passagers ont confirmé
    const allConfirmed = trip.requests.every(r => 
      r.status !== 'accepted' || 
      (r.isPickedUp && r.pickupConfirmedByPassenger)
    );

    if (allConfirmed) {
      trip.allPassengersConfirmed = true;
    }

    await trip.save();

    res.json({
      message: 'Prise en charge confirmée par le passager',
      trip: {
        id: trip._id,
        status: trip.status,
        request: {
          isPickedUp: request.isPickedUp,
          pickupConfirmedByPassenger: request.pickupConfirmedByPassenger,
          pickupConfirmedByPassengerAt: request.pickupConfirmedByPassengerAt
        }
      }
    });
  } catch (err) {
    console.error('Erreur lors de la confirmation de prise en charge:', err);
    res.status(500).json({
      message: 'Erreur lors de la confirmation de prise en charge',
      error: err.message
    });
  }
};

// Conducteur confirme avoir pris en charge les passagers
exports.confirmPickupAsDriver = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est le conducteur
    if (trip.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Vous n\'êtes pas le conducteur de ce trajet' });
    }

    // Mettre à jour le statut de prise en charge
    trip.isDriverConfirmed = true;
    trip.driverConfirmedAt = new Date();
    trip.allPassengersPickedUp = true;

    // Marquer tous les passagers acceptés comme pris en charge
    trip.requests.forEach(request => {
      if (request.status === 'accepted') {
        request.isPickedUp = true;
        request.pickedUpAt = new Date();
      }
    });

    await trip.save();

    res.json({
      message: 'Prise en charge confirmée avec succès',
      trip
    });
  } catch (err) {
    console.error('Erreur lors de la confirmation de prise en charge:', err);
    res.status(500).json({
      message: 'Erreur lors de la confirmation de prise en charge',
      error: err.message
    });
  }
};

// Passager confirme avoir été pris en charge
exports.confirmPickupAsPassenger = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Vérifier que l'utilisateur est un passager accepté
    const passengerRequest = trip.requests.find(
      request => request.userId.toString() === userId && request.status === 'accepted'
    );

    if (!passengerRequest) {
      return res.status(403).json({ message: 'Vous n\'êtes pas un passager de ce trajet' });
    }

    // Mettre à jour le statut de confirmation du passager
    passengerRequest.pickupConfirmedByPassenger = true;
    passengerRequest.pickupConfirmedByPassengerAt = new Date();

    // Vérifier si tous les passagers ont confirmé
    const allConfirmed = trip.requests.every(
      request => request.status !== 'accepted' || request.pickupConfirmedByPassenger
    );
    
    if (allConfirmed) {
      trip.allPassengersConfirmed = true;
    }

    await trip.save();

    res.json({
      message: 'Prise en charge confirmée avec succès',
      trip
    });
  } catch (err) {
    console.error('Erreur lors de la confirmation de prise en charge:', err);
    res.status(500).json({
      message: 'Erreur lors de la confirmation de prise en charge',
      error: err.message
    });
  }
};
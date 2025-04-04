const Trip = require('../models/Trip');
const User = require('../models/User');

// Créer un nouveau trajet
exports.createTrip = async (req, res) => {
  try {
    const { departure, arrival, date, time, availableSeats, vehicle, distance, duration, arrivalTime } = req.body;
    const userId = req.user.id;

    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: 'Utilisateur non trouvé',
        error: 'User not found'
      });
    }

    const trip = new Trip({
      userId: user._id, // Utiliser l'ID de l'utilisateur vérifié
      departure,
      arrival,
      date,
      time,
      availableSeats,
      vehicle,
      distance,
      duration,
      arrivalTime,
      status: 'active'
    });

    const savedTrip = await trip.save();
    
    // Ajouter les informations du conducteur dans la réponse
    const tripWithDriver = {
      ...savedTrip.toObject(),
      driver: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
        rating: user.rating || 0
      }
    };

    console.log('Nouveau trajet créé:', tripWithDriver);

    res.status(201).json({
      message: 'Trajet créé avec succès',
      trip: tripWithDriver
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

    // Récupérer tous les trajets de l'utilisateur
    const trips = await Trip.find({ userId }).sort({ date: 1, time: 1 });

    // Séparer les trajets actuels et l'historique
    const currentTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      tripDate.setHours(parseInt(trip.time.split(':')[0]), parseInt(trip.time.split(':')[1]));
      return tripDate >= currentDate;
    });

    const historicTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      tripDate.setHours(parseInt(trip.time.split(':')[0]), parseInt(trip.time.split(':')[1]));
      return tripDate < currentDate;
    });

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
      status: 'pending'
    });

    await trip.save();

    res.status(201).json({
      message: 'Demande créée avec succès',
      request: {
        userId,
        status: 'pending',
        createdAt: new Date()
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

// Récupérer les requêtes de trajet de l'utilisateur
exports.getUserTripRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    let trips;

    if (req.query.role === 'driver') {
      // Récupérer les trajets où l'utilisateur est conducteur et a des demandes
      trips = await Trip.find({ 
        userId,
        'requests.0': { $exists: true } 
      })
      .populate({
        path: 'requests.userId',
        model: 'User',
        select: 'firstName lastName email profilePicture rating'
      })
      .populate({
        path: 'userId',
        model: 'User',
        select: 'firstName lastName email profilePicture rating'
      });

    } else {
      // Récupérer les trajets où l'utilisateur est passager
      trips = await Trip.find({
        'requests.userId': userId
      })
      .populate({
        path: 'userId',
        model: 'User',
        select: 'firstName lastName email profilePicture rating'
      });
    }

    // Formater les trajets avec les informations du conducteur
    const formattedTrips = trips.map(trip => {
      const tripObj = trip.toObject();

      // Formater les informations du conducteur
      const driver = {
        _id: tripObj.userId._id,
        firstName: tripObj.userId.firstName,
        lastName: tripObj.userId.lastName,
        email: tripObj.userId.email,
        profilePicture: tripObj.userId.profilePicture || null,
        rating: tripObj.userId.rating
      };

      // Formater les requêtes avec les informations des utilisateurs
      const formattedRequests = tripObj.requests.map(request => {
        const user = {
          _id: request.userId._id,
          firstName: request.userId.firstName,
          lastName: request.userId.lastName,
          email: request.userId.email,
          profilePicture: request.userId.profilePicture || null,
          rating: request.userId.rating
        };

        return {
          ...request,
          user
        };
      });

      return {
        ...tripObj,
        driver,
        requests: formattedRequests
      };
    });

    res.json(formattedTrips);
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

    // Créer la plage de dates pour la recherche
    const searchDate = new Date(date);
    const startDate = new Date(searchDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(searchDate);
    endDate.setHours(23, 59, 59, 999);

    console.log('Recherche de trajets avec:', { departure, arrival, date, time });

    // Construire les critères de recherche
    const searchCriteria = {
      status: 'active',
      availableSeats: { $gt: 0 },
      departure: departure,
      arrival: arrival,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Rechercher les trajets avec les informations du conducteur
    const trips = await Trip.find(searchCriteria)
      .populate('userId', 'firstName lastName email profilePicture rating')
      .sort({ date: 1, time: 1 });

    console.log('Nombre de trajets trouvés:', trips.length);

    // Formater les résultats
    const formattedTrips = trips.map(trip => {
      const tripObj = trip.toObject();
      const driverInfo = tripObj.userId;

      // S'assurer que toutes les informations du conducteur sont présentes
      const driver = {
        _id: driverInfo._id,
        firstName: driverInfo.firstName,
        lastName: driverInfo.lastName,
        email: driverInfo.email,
        profilePicture: driverInfo.profilePicture,
        rating: driverInfo.rating || 0
      };

      // Retirer les informations du conducteur de l'objet principal
      delete tripObj.userId;

      // Convertir la date en chaîne de caractères ISO
      const formattedTrip = {
        ...tripObj,
        date: tripObj.date.toISOString(),
        driver,
        userId: driver._id // Garder userId pour la compatibilité
      };

      return formattedTrip;
    });

    console.log('Premier trajet formaté:', formattedTrips[0]);
    res.json(formattedTrips);
  } catch (err) {
    console.error('Erreur lors de la recherche des trajets:', err);
    res.status(500).json({
      message: 'Erreur lors de la recherche des trajets',
      error: err.message
    });
  }
};
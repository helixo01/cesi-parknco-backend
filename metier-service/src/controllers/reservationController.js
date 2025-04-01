const Reservation = require('../models/Reservation');
const Parking = require('../models/Parking');
const { validationResult } = require('express-validator');

// Créer une nouvelle réservation
exports.createReservation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { parkingId, spaceNumber, startTime, endTime, vehicleInfo } = req.body;
    const userId = req.user.id; // Obtenu via le middleware d'authentification

    // Vérifier si le parking existe
    const parking = await Parking.findById(parkingId);
    if (!parking) {
      return res.status(404).json({ message: 'Parking non trouvé' });
    }

    // Vérifier si la place est disponible
    const space = parking.spaces.find(s => s.spaceNumber === spaceNumber);
    if (!space || space.isOccupied) {
      return res.status(400).json({ message: 'Place non disponible' });
    }

    // Calculer le prix total
    const hours = Math.ceil((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60));
    const totalPrice = hours * parking.pricePerHour;

    const reservation = new Reservation({
      userId,
      parkingId,
      spaceNumber,
      startTime,
      endTime,
      totalPrice,
      vehicleInfo
    });

    await reservation.save();

    // Marquer la place comme occupée
    space.isOccupied = true;
    parking.availableSpaces--;
    await parking.save();

    res.status(201).json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les réservations d'un utilisateur
exports.getUserReservations = async (req, res) => {
  try {
    const userId = req.user.id;
    const reservations = await Reservation.find({ userId })
      .populate('parkingId', 'name address')
      .sort({ startTime: -1 });
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Annuler une réservation
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier que l'utilisateur est propriétaire de la réservation
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Vérifier que la réservation n'a pas déjà commencé
    if (new Date(reservation.startTime) < new Date()) {
      return res.status(400).json({ message: 'Impossible d\'annuler une réservation déjà commencée' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    // Libérer la place
    const parking = await Parking.findById(reservation.parkingId);
    if (parking) {
      const space = parking.spaces.find(s => s.spaceNumber === reservation.spaceNumber);
      if (space) {
        space.isOccupied = false;
        parking.availableSpaces++;
        await parking.save();
      }
    }

    res.json({ message: 'Réservation annulée avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les détails d'une réservation
exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('parkingId', 'name address pricePerHour');
    
    if (!reservation) {
      return res.status(404).json({ message: 'Réservation non trouvée' });
    }

    // Vérifier que l'utilisateur est propriétaire de la réservation
    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

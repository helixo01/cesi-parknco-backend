const Parking = require('../models/Parking');
const { validationResult } = require('express-validator');

// Obtenir tous les parkings
exports.getAllParkings = async (req, res) => {
  try {
    const parkings = await Parking.find();
    res.json(parkings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir un parking par ID
exports.getParkingById = async (req, res) => {
  try {
    const parking = await Parking.findById(req.params.id);
    if (!parking) {
      return res.status(404).json({ message: 'Parking non trouvé' });
    }
    res.json(parking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouveau parking
exports.createParking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const parking = new Parking(req.body);
    await parking.save();
    res.status(201).json(parking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un parking
exports.updateParking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const parking = await Parking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!parking) {
      return res.status(404).json({ message: 'Parking non trouvé' });
    }
    res.json(parking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut d'une place
exports.updateSpaceStatus = async (req, res) => {
  try {
    const { spaceNumber, isOccupied } = req.body;
    const parking = await Parking.findById(req.params.id);
    
    if (!parking) {
      return res.status(404).json({ message: 'Parking non trouvé' });
    }

    const space = parking.spaces.find(s => s.spaceNumber === spaceNumber);
    if (!space) {
      return res.status(404).json({ message: 'Place non trouvée' });
    }

    space.isOccupied = isOccupied;
    parking.availableSpaces = parking.spaces.filter(s => !s.isOccupied).length;
    
    await parking.save();
    res.json(parking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

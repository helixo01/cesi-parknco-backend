const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['électrique', 'diesel', 'essence', 'hybride'],
    required: true
  },
  seats: {
    type: Number,
    required: true,
    min: 1,
    max: 4  
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Créer un index pour faciliter la recherche des véhicules par utilisateur
vehicleSchema.index({ userId: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle; 
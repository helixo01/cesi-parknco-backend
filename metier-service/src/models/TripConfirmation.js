const mongoose = require('mongoose');

const tripConfirmationSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['driver', 'passenger'],
    required: true
  },
  isConfirmed: {
    type: Boolean,
    required: true
  },
  confirmedAt: {
    type: Date,
    default: Date.now
  },
  isPickedUp: {
    type: Boolean,
    default: true
  }
});

// Index pour s'assurer qu'un utilisateur ne peut confirmer qu'une fois par trajet et par rôle
tripConfirmationSchema.index({ tripId: 1, userId: 1, role: 1 }, { unique: true });

const TripConfirmation = mongoose.model('TripConfirmation', tripConfirmationSchema);

module.exports = TripConfirmation; 
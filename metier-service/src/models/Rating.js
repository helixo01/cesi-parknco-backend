const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromUserName: {
    firstName: String,
    lastName: String
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUserName: {
    firstName: String,
    lastName: String
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  role: {
    type: String,
    enum: ['driver', 'passenger'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour s'assurer qu'un utilisateur ne peut noter qu'une fois par trajet et par rôle
ratingSchema.index({ tripId: 1, fromUserId: 1, role: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating; 
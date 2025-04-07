const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  pointsPerKm: {
    type: Number,
    required: true
  },
  pointsProposedTrip: {
    type: Number,
    required: true
  },
  pointsJoinTrip: {
    type: Number,
    required: true
  },
  pointsRating: {
    type: Number,
    required: true
  },
  pointsGoodRating: {
    type: Number,
    required: true
  },
  bonusFullCar: {
    type: Number,
    required: true
  },
  bonusElectricCar: {
    type: Number,
    required: true
  },
  bonusWeeklyActive: {
    type: Boolean,
    required: true
  },
  bonusWeeklyPercentage: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Gamification', gamificationSchema); 
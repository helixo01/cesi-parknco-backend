const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  pointsPerKm: {
    type: Number,
    required: true,
    default: 1
  },
  pointsProposedTrip: {
    type: Number,
    required: true,
    default: 10
  },
  pointsJoinTrip: {
    type: Number,
    required: true,
    default: 5
  },
  pointsRating: {
    type: Number,
    required: true,
    default: 2
  },
  pointsGoodRating: {
    type: Number,
    required: true,
    default: 5
  },
  bonusFullCar: {
    type: Number,
    required: true,
    default: 10
  },
  bonusElectricCar: {
    type: Number,
    required: true,
    default: 15
  },
  bonusWeeklyActive: {
    type: Boolean,
    required: true,
    default: false
  },
  bonusWeeklyPercentage: {
    type: Number,
    required: true,
    default: 0.1
  }
}, {
  timestamps: true
});

// Fonction statique pour obtenir ou créer la configuration par défaut
gamificationSchema.statics.getDefaultConfig = async function() {
  let config = await this.findOne().sort({ createdAt: -1 });
  if (!config) {
    config = new this();
    await config.save();
  }
  return config;
};

module.exports = mongoose.model('Gamification', gamificationSchema); 
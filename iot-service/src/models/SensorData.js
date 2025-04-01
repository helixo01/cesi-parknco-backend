const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    ref: 'Sensor'
  },
  type: {
    type: String,
    enum: ['presence', 'temperature', 'humidity'],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    parkingId: String,
    spaceNumber: String
  },
  metadata: {
    batteryLevel: Number,
    signalStrength: Number,
    error: String
  }
});

// Index pour améliorer les performances des recherches
sensorDataSchema.index({ sensorId: 1, timestamp: -1 });
sensorDataSchema.index({ 'location.parkingId': 1, timestamp: -1 });

// TTL index pour supprimer automatiquement les anciennes données après 30 jours
sensorDataSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('SensorData', sensorDataSchema);

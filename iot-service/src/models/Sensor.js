const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['presence', 'temperature', 'humidity'],
    required: true
  },
  location: {
    parkingId: {
      type: String,
      required: true
    },
    spaceNumber: String,
    zone: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error'],
    default: 'active'
  },
  lastReading: {
    value: mongoose.Schema.Types.Mixed,
    timestamp: Date
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100
  },
  firmware: {
    version: String,
    lastUpdate: Date
  },
  maintenance: {
    lastCheck: Date,
    nextCheck: Date,
    issues: [{
      description: String,
      date: Date,
      resolved: Boolean
    }]
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des recherches
sensorSchema.index({ 'location.parkingId': 1, 'location.spaceNumber': 1 });
sensorSchema.index({ status: 1 });

module.exports = mongoose.model('Sensor', sensorSchema);

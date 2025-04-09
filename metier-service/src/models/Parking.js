const mongoose = require('mongoose');

const parkingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    street: String,
    city: String,
    zipCode: String,
    country: String
  },
  totalSpaces: {
    type: Number,
    required: true,
    min: 1
  },
  availableSpaces: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerHour: {
    type: Number,
    required: true,
    min: 0
  },
  spaces: [{
    spaceNumber: {
      type: String,
      required: true
    },
    isOccupied: {
      type: Boolean,
      default: false
    },
    sensorId: {
      type: String,
      required: true
    }
  }],
  operatingHours: {
    open: {
      type: String,
      default: "00:00"
    },
    close: {
      type: String,
      default: "23:59"
    }
  },
  features: [{
    type: String,
    enum: ['handicap', 'electric', 'covered', 'security']
  }],
  status: {
    type: String,
    enum: ['active', 'maintenance', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Parking', parkingSchema);

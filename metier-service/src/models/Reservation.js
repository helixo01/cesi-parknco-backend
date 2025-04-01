const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  parkingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parking',
    required: true
  },
  spaceNumber: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  vehicleInfo: {
    plate: String,
    type: {
      type: String,
      enum: ['car', 'motorcycle', 'electric']
    }
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des recherches
reservationSchema.index({ userId: 1, status: 1 });
reservationSchema.index({ parkingId: 1, startTime: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);

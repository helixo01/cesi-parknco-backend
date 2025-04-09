const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['security', 'payment', 'notification', 'maintenance', 'general'],
    required: true
  },
  lastModifiedBy: {
    userId: String,
    email: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des recherches
systemConfigSchema.index({ category: 1, key: 1 });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);

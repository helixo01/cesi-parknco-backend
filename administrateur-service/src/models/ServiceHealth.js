const mongoose = require('mongoose');

const serviceHealthSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
    enum: ['authentification', 'metier', 'iot', 'administrateur']
  },
  status: {
    type: String,
    enum: ['healthy', 'degraded', 'down'],
    required: true
  },
  lastCheck: {
    type: Date,
    default: Date.now
  },
  metrics: {
    responseTime: Number,
    uptime: Number,
    memoryUsage: Number,
    cpuUsage: Number
  },
  lastError: {
    message: String,
    timestamp: Date,
    stack: String
  },
  endpoint: {
    url: String,
    port: Number
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances des recherches
serviceHealthSchema.index({ serviceName: 1, status: 1 });
serviceHealthSchema.index({ lastCheck: -1 });

module.exports = mongoose.model('ServiceHealth', serviceHealthSchema);

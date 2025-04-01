const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'config_change', 'error']
  },
  serviceName: {
    type: String,
    required: true
  },
  userId: String,
  userEmail: String,
  resourceType: {
    type: String,
    required: true
  },
  resourceId: String,
  details: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index pour améliorer les performances des recherches
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ serviceName: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });

// TTL index pour supprimer automatiquement les logs après 90 jours
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

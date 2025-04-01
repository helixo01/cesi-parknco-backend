const SystemConfig = require('../models/SystemConfig');
const ServiceHealth = require('../models/ServiceHealth');
const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');
const axios = require('axios');

// Gérer la configuration du système
exports.updateConfig = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { key, value, category, description } = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      { key },
      {
        value,
        category,
        description,
        lastModifiedBy: {
          userId: req.user.id,
          email: req.user.email
        }
      },
      { new: true, upsert: true }
    );

    // Enregistrer l'action dans les logs d'audit
    await new AuditLog({
      action: 'config_change',
      serviceName: 'administrateur',
      userId: req.user.id,
      userEmail: req.user.email,
      resourceType: 'system_config',
      resourceId: config._id,
      details: { key, oldValue: req.body.oldValue, newValue: value },
      status: 'success'
    }).save();

    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir la configuration du système
exports.getConfig = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const configs = await SystemConfig.find(query);
    res.json(configs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Vérifier la santé des services
exports.checkServicesHealth = async (req, res) => {
  try {
    const services = [
      { name: 'authentification', url: process.env.AUTH_SERVICE_URL },
      { name: 'metier', url: process.env.METIER_SERVICE_URL },
      { name: 'iot', url: process.env.IOT_SERVICE_URL }
    ];

    const healthChecks = await Promise.all(services.map(async (service) => {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${service.url}/health`);
        const responseTime = Date.now() - startTime;

        const health = new ServiceHealth({
          serviceName: service.name,
          status: 'healthy',
          metrics: {
            responseTime,
            uptime: response.data.uptime
          },
          endpoint: {
            url: service.url
          }
        });

        await health.save();
        return health;
      } catch (error) {
        const health = new ServiceHealth({
          serviceName: service.name,
          status: 'down',
          lastError: {
            message: error.message,
            timestamp: new Date()
          },
          endpoint: {
            url: service.url
          }
        });

        await health.save();
        return health;
      }
    }));

    res.json(healthChecks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les logs d'audit
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      action, 
      serviceName, 
      userId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 50 
    } = req.query;

    const query = {};
    if (action) query.action = action;
    if (serviceName) query.serviceName = serviceName;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir les statistiques du système
exports.getSystemStats = async (req, res) => {
  try {
    const stats = {
      services: {
        total: await ServiceHealth.distinct('serviceName').count(),
        healthy: await ServiceHealth.countDocuments({ status: 'healthy' }),
        degraded: await ServiceHealth.countDocuments({ status: 'degraded' }),
        down: await ServiceHealth.countDocuments({ status: 'down' })
      },
      auditLogs: {
        total: await AuditLog.countDocuments(),
        byService: await AuditLog.aggregate([
          { $group: { _id: '$serviceName', count: { $sum: 1 } } }
        ]),
        byAction: await AuditLog.aggregate([
          { $group: { _id: '$action', count: { $sum: 1 } } }
        ])
      },
      configs: {
        total: await SystemConfig.countDocuments(),
        byCategory: await SystemConfig.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } }
        ])
      }
    };

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

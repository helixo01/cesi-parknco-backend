const Sensor = require('../models/Sensor');
const SensorData = require('../models/SensorData');
const { validationResult } = require('express-validator');
const axios = require('axios');

// Enregistrer un nouveau capteur
exports.registerSensor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const sensor = new Sensor(req.body);
    await sensor.save();
    res.status(201).json(sensor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Recevoir des données d'un capteur
exports.receiveSensorData = async (req, res) => {
  try {
    const { sensorId, value, type } = req.body;

    // Vérifier si le capteur existe
    const sensor = await Sensor.findOne({ sensorId });
    if (!sensor) {
      return res.status(404).json({ message: 'Capteur non trouvé' });
    }

    // Enregistrer les données du capteur
    const sensorData = new SensorData({
      sensorId,
      type,
      value,
      location: sensor.location,
      metadata: {
        batteryLevel: req.body.batteryLevel,
        signalStrength: req.body.signalStrength
      }
    });

    await sensorData.save();

    // Mettre à jour le dernier relevé du capteur
    sensor.lastReading = {
      value,
      timestamp: new Date()
    };
    sensor.batteryLevel = req.body.batteryLevel;
    await sensor.save();

    // Si c'est un capteur de présence, mettre à jour l'état de la place
    if (type === 'presence' && sensor.location.parkingId && sensor.location.spaceNumber) {
      try {
        // Appeler le service métier pour mettre à jour l'état de la place
        await axios.patch(`${process.env.METIER_SERVICE_URL}/api/parkings/${sensor.location.parkingId}/space`, {
          spaceNumber: sensor.location.spaceNumber,
          isOccupied: value === true
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'état de la place:', error);
      }
    }

    res.status(200).json(sensorData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir l'état d'un capteur
exports.getSensorStatus = async (req, res) => {
  try {
    const sensor = await Sensor.findOne({ sensorId: req.params.sensorId });
    if (!sensor) {
      return res.status(404).json({ message: 'Capteur non trouvé' });
    }
    res.json(sensor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Obtenir l'historique des données d'un capteur
exports.getSensorHistory = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const { start, end } = req.query;

    const query = { sensorId };
    if (start || end) {
      query.timestamp = {};
      if (start) query.timestamp.$gte = new Date(start);
      if (end) query.timestamp.$lte = new Date(end);
    }

    const data = await SensorData.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut d'un capteur
exports.updateSensorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const sensor = await Sensor.findOneAndUpdate(
      { sensorId: req.params.sensorId },
      { status },
      { new: true }
    );

    if (!sensor) {
      return res.status(404).json({ message: 'Capteur non trouvé' });
    }

    res.json(sensor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

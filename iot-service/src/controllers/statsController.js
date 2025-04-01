const Sensor = require('../models/Sensor');
const SensorData = require('../models/SensorData');

exports.getSensorStats = async (req, res) => {
    try {
        const sensors = await Sensor.find();
        const sensorData = await SensorData.find().sort({ timestamp: -1 }).limit(1000);

        // Statut des capteurs
        const sensorStatus = {
            total: sensors.length,
            active: sensors.filter(s => s.status === 'active').length,
            maintenance: sensors.filter(s => s.status === 'maintenance').length,
            error: sensors.filter(s => s.status === 'error').length
        };

        // Niveaux de batterie
        const batteryLevels = {
            critical: sensors.filter(s => s.batteryLevel < 20).length,
            low: sensors.filter(s => s.batteryLevel >= 20 && s.batteryLevel < 50).length,
            medium: sensors.filter(s => s.batteryLevel >= 50 && s.batteryLevel < 80).length,
            good: sensors.filter(s => s.batteryLevel >= 80).length
        };

        // Capteurs nécessitant une maintenance
        const maintenanceNeeded = sensors
            .filter(s => s.status === 'maintenance' || s.batteryLevel < 20)
            .map(s => ({
                sensorId: s.sensorId,
                type: s.type,
                location: s.location,
                status: s.status,
                batteryLevel: s.batteryLevel,
                lastMaintenance: s.lastMaintenance
            }));

        // Qualité des données
        const calculateDataQuality = () => {
            if (sensorData.length === 0) return 100;

            const invalidData = sensorData.filter(data => 
                data.value === null || 
                data.value === undefined || 
                isNaN(data.value)
            ).length;

            return ((sensorData.length - invalidData) / sensorData.length * 100).toFixed(2);
        };

        // Temps de fonctionnement moyen
        const calculateUptime = () => {
            const now = new Date();
            return sensors.reduce((acc, sensor) => {
                const lastReading = new Date(sensor.lastReading);
                const timeDiff = now - lastReading;
                return acc + (timeDiff < 24 * 60 * 60 * 1000 ? 1 : 0); // Considéré actif si dernière lecture < 24h
            }, 0) / sensors.length * 100;
        };

        const stats = {
            sensorStatus,
            batteryLevels,
            maintenanceNeeded,
            dataQuality: parseFloat(calculateDataQuality()),
            uptime: parseFloat(calculateUptime().toFixed(2))
        };

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des capteurs' });
    }
};

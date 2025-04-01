const axios = require('axios');
const AuditLog = require('../models/AuditLog');

// Obtenir les statistiques globales de l'application
exports.getGlobalStats = async (req, res) => {
    try {
        // Récupérer les statistiques de tous les services en parallèle
        const [parkingStats, reservationStats, sensorStats, userStats] = await Promise.all([
            // Statistiques des parkings
            axios.get(`${process.env.METIER_SERVICE_URL}/api/parkings/stats`),
            // Statistiques des réservations
            axios.get(`${process.env.METIER_SERVICE_URL}/api/reservations/stats`),
            // Statistiques des capteurs
            axios.get(`${process.env.IOT_SERVICE_URL}/api/sensors/stats`),
            // Statistiques des utilisateurs
            axios.get(`${process.env.AUTH_SERVICE_URL}/api/auth/stats`)
        ]);

        const stats = {
            parkings: {
                total: parkingStats.data.total,
                occupancyRate: parkingStats.data.occupancyRate,
                totalRevenue: parkingStats.data.totalRevenue,
                averageOccupancyTime: parkingStats.data.averageOccupancyTime
            },
            reservations: {
                total: reservationStats.data.total,
                active: reservationStats.data.active,
                completed: reservationStats.data.completed,
                cancelled: reservationStats.data.cancelled,
                averageDuration: reservationStats.data.averageDuration
            },
            sensors: {
                total: sensorStats.data.total,
                active: sensorStats.data.active,
                maintenance: sensorStats.data.maintenance,
                error: sensorStats.data.error,
                batteryLevels: sensorStats.data.batteryLevels
            },
            occupancy: {
                current: parkingStats.data.currentOccupancy,
                peak: parkingStats.data.peakOccupancy,
                low: parkingStats.data.lowOccupancy,
                trends: parkingStats.data.occupancyTrends
            },
            revenue: {
                daily: parkingStats.data.dailyRevenue,
                weekly: parkingStats.data.weeklyRevenue,
                monthly: parkingStats.data.monthlyRevenue,
                yearly: parkingStats.data.yearlyRevenue
            }
        };

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
};

// Obtenir les statistiques d'occupation par période
exports.getOccupancyStats = async (req, res) => {
    try {
        const { startDate, endDate, interval } = req.query;
        
        const response = await axios.get(`${process.env.METIER_SERVICE_URL}/api/parkings/occupancy`, {
            params: { startDate, endDate, interval }
        });

        const stats = {
            occupancyData: response.data.occupancyData,
            averageOccupancy: response.data.averageOccupancy,
            peakHours: response.data.peakHours,
            quietHours: response.data.quietHours
        };

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques d\'occupation' });
    }
};

// Obtenir les statistiques de revenus
exports.getRevenueStats = async (req, res) => {
    try {
        const { startDate, endDate, groupBy } = req.query;
        
        const response = await axios.get(`${process.env.METIER_SERVICE_URL}/api/parkings/revenue`, {
            params: { startDate, endDate, groupBy }
        });

        const stats = {
            revenueData: response.data.revenueData,
            totalRevenue: response.data.totalRevenue,
            averageRevenue: response.data.averageRevenue,
            bestPerformingParkings: response.data.bestPerformingParkings
        };

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques de revenus' });
    }
};

// Obtenir les statistiques des capteurs IoT
exports.getSensorStats = async (req, res) => {
    try {
        const response = await axios.get(`${process.env.IOT_SERVICE_URL}/api/sensors/stats`);

        const stats = {
            sensorStatus: response.data.sensorStatus,
            batteryLevels: response.data.batteryLevels,
            maintenanceNeeded: response.data.maintenanceNeeded,
            dataQuality: response.data.dataQuality,
            uptime: response.data.uptime
        };

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des capteurs' });
    }
};

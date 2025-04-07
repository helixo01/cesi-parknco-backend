const Parking = require('../models/Parking');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Rating = require('../models/Rating');
const TripConfirmation = require('../models/TripConfirmation');
const mongoose = require('mongoose');
const axios = require('axios');

// Fonction pour récupérer la configuration de gamification
const getGamificationConfig = async () => {
  try {
    const response = await axios.get(`${process.env.ADMIN_SERVICE_URL}/api/gamification`, {
      headers: {
        'X-Service-Name': 'metier-service'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching gamification config:', error);
    throw new Error('Unable to fetch gamification configuration');
  }
};


// Statistiques des parkings
exports.getParkingStats = async (req, res) => {
    try {
        const parkings = await Parking.find();
        const reservations = await Reservation.find();
        
        // Calcul des statistiques de base
        const totalParkings = parkings.length;
        const totalSpaces = parkings.reduce((acc, park) => acc + park.totalSpaces, 0);
        const occupiedSpaces = parkings.reduce((acc, park) => acc + (park.totalSpaces - park.availableSpaces), 0);
        const occupancyRate = (occupiedSpaces / totalSpaces * 100).toFixed(2);

        // Calcul des revenus
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

        const dailyReservations = reservations.filter(r => r.startTime >= today);
        const weeklyReservations = reservations.filter(r => r.startTime >= lastWeek);
        const monthlyReservations = reservations.filter(r => r.startTime >= lastMonth);

        const calculateRevenue = (reservations) => {
            return reservations.reduce((acc, res) => {
                const duration = (res.endTime - res.startTime) / (1000 * 60 * 60); // en heures
                const parking = parkings.find(p => p._id.equals(res.parkingId));
                return acc + (duration * (parking ? parking.pricePerHour : 0));
            }, 0);
        };

        // Calcul des tendances d'occupation
        const calculateOccupancyTrends = () => {
            const hours = Array(24).fill(0);
            reservations.forEach(res => {
                const startHour = new Date(res.startTime).getHours();
                hours[startHour]++;
            });
            return hours;
        };

        const stats = {
            total: totalParkings,
            totalSpaces,
            occupiedSpaces,
            availableSpaces: totalSpaces - occupiedSpaces,
            occupancyRate: parseFloat(occupancyRate),
            currentOccupancy: occupiedSpaces,
            peakOccupancy: Math.max(...parkings.map(p => p.totalSpaces - p.availableSpaces)),
            lowOccupancy: Math.min(...parkings.map(p => p.totalSpaces - p.availableSpaces)),
            occupancyTrends: calculateOccupancyTrends(),
            totalRevenue: calculateRevenue(reservations),
            dailyRevenue: calculateRevenue(dailyReservations),
            weeklyRevenue: calculateRevenue(weeklyReservations),
            monthlyRevenue: calculateRevenue(monthlyReservations),
            averageOccupancyTime: reservations.length > 0 
                ? reservations.reduce((acc, res) => 
                    acc + (res.endTime - res.startTime) / (1000 * 60 * 60), 0) / reservations.length 
                : 0
        };

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des parkings' });
    }
};

// Statistiques des réservations
exports.getReservationStats = async (req, res) => {
    try {
        const reservations = await Reservation.find();
        const now = new Date();

        const stats = {
            total: reservations.length,
            active: reservations.filter(r => r.startTime <= now && r.endTime >= now).length,
            completed: reservations.filter(r => r.endTime < now).length,
            cancelled: reservations.filter(r => r.status === 'cancelled').length,
            averageDuration: reservations.length > 0 
                ? reservations.reduce((acc, res) => 
                    acc + (res.endTime - res.startTime) / (1000 * 60 * 60), 0) / reservations.length 
                : 0
        };

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques des réservations' });
    }
};

// Statistiques d'occupation par période
exports.getOccupancyStats = async (req, res) => {
    try {
        const { startDate, endDate, interval = 'hour' } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);

        const reservations = await Reservation.find({
            startTime: { $gte: start },
            endTime: { $lte: end }
        });

        const parkings = await Parking.find();
        const totalSpaces = parkings.reduce((acc, park) => acc + park.totalSpaces, 0);

        // Grouper les données par intervalle
        const occupancyData = [];
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            const occupiedSpaces = reservations.filter(r => 
                r.startTime <= currentDate && r.endTime >= currentDate
            ).length;

            occupancyData.push({
                timestamp: currentDate.toISOString(),
                occupancy: occupiedSpaces,
                occupancyRate: (occupiedSpaces / totalSpaces * 100).toFixed(2)
            });

            // Incrémenter selon l'intervalle
            switch(interval) {
                case 'hour':
                    currentDate = new Date(currentDate.setHours(currentDate.getHours() + 1));
                    break;
                case 'day':
                    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
                    break;
                case 'week':
                    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 7));
                    break;
                case 'month':
                    currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
                    break;
            }
        }

        // Calculer les heures de pointe et creuses
        const hourlyOccupancy = Array(24).fill(0);
        reservations.forEach(res => {
            const hour = new Date(res.startTime).getHours();
            hourlyOccupancy[hour]++;
        });

        const peakHours = hourlyOccupancy
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        const quietHours = hourlyOccupancy
            .map((count, hour) => ({ hour, count }))
            .sort((a, b) => a.count - b.count)
            .slice(0, 3);

        res.json({
            occupancyData,
            averageOccupancy: occupancyData.reduce((acc, data) => acc + parseFloat(data.occupancyRate), 0) / occupancyData.length,
            peakHours,
            quietHours
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques d\'occupation' });
    }
};

// Statistiques des revenus
exports.getRevenueStats = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'day' } = req.query;
        const start = new Date(startDate);
        const end = new Date(endDate);

        const reservations = await Reservation.find({
            startTime: { $gte: start },
            endTime: { $lte: end }
        }).populate('parkingId');

        // Grouper les revenus par période
        const revenueData = [];
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            let nextDate;
            switch(groupBy) {
                case 'day':
                    nextDate = new Date(currentDate);
                    nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'week':
                    nextDate = new Date(currentDate);
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'month':
                    nextDate = new Date(currentDate);
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
            }

            const periodReservations = reservations.filter(r => 
                r.startTime >= currentDate && r.startTime < nextDate
            );

            const revenue = periodReservations.reduce((acc, res) => {
                const duration = (res.endTime - res.startTime) / (1000 * 60 * 60);
                return acc + (duration * res.parkingId.pricePerHour);
            }, 0);

            revenueData.push({
                period: currentDate.toISOString(),
                revenue: revenue.toFixed(2)
            });

            currentDate = nextDate;
        }

        // Calculer les parkings les plus performants
        const parkingRevenue = {};
        reservations.forEach(res => {
            const duration = (res.endTime - res.startTime) / (1000 * 60 * 60);
            const revenue = duration * res.parkingId.pricePerHour;
            
            if (!parkingRevenue[res.parkingId._id]) {
                parkingRevenue[res.parkingId._id] = {
                    parkingId: res.parkingId._id,
                    name: res.parkingId.name,
                    revenue: 0
                };
            }
            parkingRevenue[res.parkingId._id].revenue += revenue;
        });

        const bestPerformingParkings = Object.values(parkingRevenue)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        res.json({
            revenueData,
            totalRevenue: revenueData.reduce((acc, data) => acc + parseFloat(data.revenue), 0),
            averageRevenue: revenueData.reduce((acc, data) => acc + parseFloat(data.revenue), 0) / revenueData.length,
            bestPerformingParkings
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques de revenus' });
    }
};

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Récupérer la configuration de gamification
    const config = await getGamificationConfig();

    // Récupérer l'utilisateur depuis la base de données d'authentification
    const authDb = mongoose.connection.useDb('parknco-auth');
    const AuthUser = authDb.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      role: String,
      active: Boolean
    }));

    const user = await AuthUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Récupérer tous les trajets où l'utilisateur est conducteur ou passager
    const userTrips = await Trip.find({
      $or: [
        { userId: userId },
        { 'requests.userId': userId, 'requests.status': 'accepted' }
      ]
    });

    let totalPoints = 0;
    let totalRating = 0;
    let ratingCount = 0;

    // Points pour les trajets
    for (const trip of userTrips) {
      if (trip.userId.toString() === userId) {
        // Points pour avoir proposé un trajet
        totalPoints += config.pointsProposedTrip;
        
        // Points par km
        const distance = parseFloat(trip.distance);
        if (!isNaN(distance)) {
          totalPoints += distance * config.pointsPerKm;
        }

        // Bonus voiture pleine (3 passagers ou plus)
        const acceptedRequests = trip.requests.filter(r => r.status === 'accepted').length;
        if (acceptedRequests >= 3) {
          totalPoints *= config.bonusFullCar;
        }

        // Bonus voiture électrique
        if (trip.vehicle === "electrique") {
          totalPoints += config.bonusElectricCar;
        }
      } else {
        // Points pour avoir rejoint un trajet
        totalPoints += config.pointsJoinTrip;
        
        // Points par km en tant que passager
        const distance = parseFloat(trip.distance);
        if (!isNaN(distance)) {
          totalPoints += distance * config.pointsPerKm;
        }
      }
    }

    // Récupérer toutes les notes reçues et données
    const ratings = await Rating.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    });

    for (const rating of ratings) {
      if (rating.toUserId.toString() === userId) {
        // Notes reçues
        totalRating += rating.rating;
        ratingCount++;

        // Bonus pour les bonnes notes (≥ 4)
        if (rating.rating >= 4) {
          totalPoints += config.pointsGoodRating;
        }
      } else {
        // Points pour avoir donné une note
        totalPoints += config.pointsRating;
      }
    }

    // Calculer la moyenne des notes
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // Récupérer tous les utilisateurs depuis la base de données d'authentification
    const allUsers = await AuthUser.find({ active: true });
    const userStats = await Promise.all(
      allUsers.map(async (user) => {
        const userTrips = await Trip.find({
          $or: [
            { userId: user._id },
            { 'requests.userId': user._id, 'requests.status': 'accepted' }
          ]
        });

        let points = 0;
        
        // Calculer les points pour chaque utilisateur
        for (const trip of userTrips) {
          if (trip.userId.toString() === user._id.toString()) {
            points += config.pointsProposedTrip;
            const distance = parseFloat(trip.distance);
            if (!isNaN(distance)) {
              points += distance * config.pointsPerKm;
            }
            const acceptedRequests = trip.requests.filter(r => r.status === 'accepted').length;
            if (acceptedRequests >= 3) {
              points *= config.bonusFullCar;
            }
            if (trip.vehicle === "electrique") {
              points += config.bonusElectricCar;
            }
          } else {
            points += config.pointsJoinTrip;
            const distance = parseFloat(trip.distance);
            if (!isNaN(distance)) {
              points += distance * config.pointsPerKm;
            }
          }
        }

        const userRatings = await Rating.find({
          $or: [
            { fromUserId: user._id },
            { toUserId: user._id }
          ]
        });

        for (const rating of userRatings) {
          if (rating.toUserId.toString() === user._id.toString()) {
            if (rating.rating >= 4) {
              points += config.pointsGoodRating;
            }
          } else {
            points += config.pointsRating;
          }
        }

        return {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          points
        };
      })
    );

    // Filtrer les utilisateurs admin_user avant le tri
    const filteredUsers = userStats.filter(user => user.role !== 'admin_user');

    // Trier les utilisateurs par points et ajouter leur rang
    const sortedUsers = filteredUsers
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    // Trouver le rang de l'utilisateur actuel (seulement s'il n'est pas admin_user)
    const userRank = user.role !== 'admin_user' 
      ? sortedUsers.find(user => user.id.toString() === userId)?.rank || 0
      : 0;

    res.json({
      totalPoints: user.role !== 'admin_user' ? totalPoints : 0,
      averageRating: user.role !== 'admin_user' ? averageRating : 0,
      rank: userRank,
      leaderboard: sortedUsers
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Error getting user stats' });
  }
};

exports.getAllUsersStats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Récupérer la configuration de gamification
    const config = await getGamificationConfig();

    // Connexion à la base de données d'authentification
    const authDb = mongoose.connection.useDb('parknco-auth');
    const AuthUser = authDb.model('User', new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: String,
      role: String,
      active: Boolean
    }));

    // Récupérer tous les utilisateurs actifs depuis la base de données d'authentification
    const allUsers = await AuthUser.find({ active: true });
    const userStats = await Promise.all(
      allUsers.map(async (user) => {
        const userTrips = await Trip.find({
          $or: [
            { userId: user._id },
            { 'requests.userId': user._id, 'requests.status': 'accepted' }
          ]
        });

        let points = 0;
        
        // Calculer les points pour chaque utilisateur
        for (const trip of userTrips) {
          if (trip.userId.toString() === user._id.toString()) {
            points += config.pointsProposedTrip;
            const distance = parseFloat(trip.distance);
            if (!isNaN(distance)) {
              points += distance * config.pointsPerKm;
            }
            const acceptedRequests = trip.requests.filter(r => r.status === 'accepted').length;
            if (acceptedRequests >= 3) {
              points *= config.bonusFullCar;
            }
            if (trip.vehicle === "electrique") {
              points += config.bonusElectricCar;
            }
          } else {
            points += config.pointsJoinTrip;
            const distance = parseFloat(trip.distance);
            if (!isNaN(distance)) {
              points += distance * config.pointsPerKm;
            }
          }
        }

        const userRatings = await Rating.find({
          $or: [
            { fromUserId: user._id },
            { toUserId: user._id }
          ]
        });

        for (const rating of userRatings) {
          if (rating.toUserId.toString() === user._id.toString()) {
            if (rating.rating >= 4) {
              points += config.pointsGoodRating;
            }
          } else {
            points += config.pointsRating;
          }
        }

        return {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          points
        };
      })
    );

    // Filtrer les utilisateurs admin_user avant le tri
    const filteredUsers = userStats.filter(user => user.role !== 'admin_user');

    // Trier les utilisateurs par points et ajouter leur rang
    const sortedUsers = filteredUsers
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    const total = sortedUsers.length;
    const pages = Math.ceil(total / limit);
    const paginatedUsers = sortedUsers.slice(skip, skip + limit);

    res.json({
      users: paginatedUsers,
      total,
      page,
      pages
    });
  } catch (error) {
    console.error('Error getting all users stats:', error);
    res.status(500).json({ message: error.message || 'Error getting all users stats' });
  }
};

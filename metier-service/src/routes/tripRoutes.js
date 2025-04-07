const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('../middleware/authMiddleware');

// Routes existantes
router.post('/', authMiddleware, tripController.createTrip);
router.get('/my-trips', authMiddleware, tripController.getMyTrips);
router.get('/search', authMiddleware, tripController.searchTrips);
router.post('/:tripId/requests', authMiddleware, tripController.createTripRequest);
router.put('/:tripId/requests/:requestId', authMiddleware, tripController.handleTripRequest);
router.get('/:tripId/requests', authMiddleware, tripController.getTripRequests);

// Route pour confirmer la fin du trajet par le conducteur
router.post('/:tripId/complete-trip', authMiddleware, tripController.confirmPickup);

// Routes pour les notes
router.post('/:tripId/rate-driver', authMiddleware, ratingController.completeAsPassenger);
router.post('/:tripId/rate-passenger', authMiddleware, ratingController.completeAsDriver);
router.get('/users/:userId/ratings', authMiddleware, ratingController.getUserRatings);

module.exports = router; 
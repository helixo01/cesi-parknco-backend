require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const parkingRoutes = require('./routes/parking');
const tripController = require('./controllers/tripController');
const userController = require('./controllers/userController');
const reservationRoutes = require('./routes/reservation');
const auth = require('./middleware/auth');
const ratingController = require('./controllers/ratingController');
const tripConfirmationController = require('./controllers/tripConfirmationController');

const app = express();
app.use(express.json());
app.use(cookieParser());

// Configuration pour servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true
}));

// Logging middleware pour le debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.AUTH_DB_URI || process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Auth Database'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.post('/api/trips', auth, tripController.createTrip);
app.get('/api/trips/my-trips', auth, tripController.getMyTrips);
app.get('/api/trips/search', auth, tripController.searchTrips);
app.get('/api/trips/:id', auth, tripController.getTripById);
app.put('/api/trips/:id', auth, tripController.updateTrip);
app.delete('/api/trips/:id', auth, tripController.deleteTrip);

// Routes pour les demandes de trajet
app.post('/api/trips/:tripId/requests', auth, tripController.createTripRequest);
app.put('/api/trips/:tripId/requests/:requestId', auth, tripController.handleTripRequest);
app.get('/api/trips/:tripId/requests', auth, tripController.getTripRequests);
app.get('/api/users/requests', auth, tripController.getUserTripRequests);

// Routes pour la confirmation de prise en charge
app.post('/api/trips/:tripId/confirm-driver', auth, tripConfirmationController.confirmAsDriver);
app.post('/api/trips/:tripId/confirm-passenger', auth, tripConfirmationController.confirmAsPassenger);

// Routes pour les notations
app.post('/api/trips/:tripId/rate-driver', auth, ratingController.completeAsPassenger);
app.post('/api/trips/:tripId/rate-passenger', auth, ratingController.completeAsDriver);
app.get('/api/users/:userId/ratings', auth, ratingController.getUserRatings);

// Route pour les informations publiques des utilisateurs
app.get('/api/users/public/:userId', auth, userController.getPublicUserInfo);

app.use('/api/parkings', parkingRoutes);
app.use('/api/reservations', reservationRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'metier-service' });
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`Service métier running on port ${PORT}`);
});

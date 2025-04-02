require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const parkingRoutes = require('./routes/parking');
const tripController = require('./controllers/tripcontroller');
const reservationRoutes = require('./routes/reservation');
const auth = require('./middleware/auth');

const app = express();
app.use(express.json());

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.post('/trips', auth, tripController.createTrip);
app.get('/trips', auth, tripController.getAllTrips);
app.get('/trips/:id', auth, tripController.getTripById);
app.put('/trips/:id', auth, tripController.updateTrip);
app.delete('/trips/:id', auth, tripController.deleteTrip);

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

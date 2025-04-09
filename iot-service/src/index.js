require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sensorRoutes = require('./routes/sensor');

const app = express();

// Middleware
app.use(cors({
    origin: true, // Accepte toutes les origines en développement
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.use('/api/sensors', sensorRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'iot-service' });
});

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`Service IoT running on port ${PORT}`);
});

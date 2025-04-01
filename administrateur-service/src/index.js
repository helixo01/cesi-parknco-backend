require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const statsRoutes = require('./routes/stats');
const systemRoutes = require('./routes/system');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.use('/api/stats', statsRoutes);   // Routes des statistiques
app.use('/api/system', systemRoutes); // Routes pour l'admin technique

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'administrateur-service',
        uptime: process.uptime()
    });
});

// Start server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`Service administrateur running on port ${PORT}`);
});

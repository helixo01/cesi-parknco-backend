const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Configuration de express-fileupload
app.use(fileUpload({
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  abortOnLimit: true,
  responseOnLimit: 'La taille du fichier ne doit pas dépasser 5MB',
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: process.env.NODE_ENV === 'development'
}));

// Servir les fichiers statiques
app.use('/uploads', express.static('uploads'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));    // Routes d'authentification publiques
app.use('/api/users', require('./routes/users'));   // Routes de gestion des utilisateurs (admin)
app.use('/auth', require('./routes/auth')); 

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ 
    message: 'Une erreur est survenue',
    error: err.message 
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Service authentification running on port ${PORT}`);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
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
app.use('/api/auth', require('./routes/auth'));    // Routes d'authentification publiques
app.use('/api/users', require('./routes/users'));   // Routes de gestion des utilisateurs (admin)
app.use('/auth', require('./routes/auth')); 

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        timestamp: new Date()
    });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Service authentification running on port ${PORT}`);
});

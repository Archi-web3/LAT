require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
    'https://lat-lemon.vercel.app',
    'http://localhost:4200',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Allow any localhost origin for development
        if (origin.startsWith('http://localhost:')) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
    },
    credentials: true
}));

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/assessments', require('./routes/assessmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/config', require('./routes/configRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('ELAT API is Running');
});

// Database Connection
const connectDB = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Fail after 5 seconds instead of hanging
        });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        // Log generic error if message is missing
        if (!err.message) console.error('❌ Full Error:', err);
        process.exit(1);
    }
};

// Start Server
if (process.env.MONGO_URI) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    });
} else {
    console.log('⚠️ MONGO_URI not found in .env. Server not started.');
}

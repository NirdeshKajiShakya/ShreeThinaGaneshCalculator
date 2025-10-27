const express = require('express');
const path = require('path');

// Initialize database
require('./database');

const app = express();

// Set the port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Nepal Gold & Silver Jewelry Calculator is running',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api', require('./routes/gold'));
app.use('/api', require('./routes/silver'));
app.use('/api', require('./routes/jewelry'));

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🪙✨ Nepal Gold & Silver Jewelry Calculator is running on port ${PORT}`);
    console.log(`📊 Access the app at: http://localhost:${PORT}`);
});

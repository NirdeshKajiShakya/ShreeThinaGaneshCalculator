const express = require('express');
const path = require('path');
const app = express();

// Set the port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Nepal Silver Price Tracker is running',
        timestamp: new Date().toISOString()
    });
});

// API endpoint for future silver price integration
app.get('/api/silver-price', (req, res) => {
    // This is a placeholder - in production, fetch from real API
    const basePrice = 150 + (Math.random() - 0.5) * 5;
    res.json({
        pricePerGram: basePrice.toFixed(2),
        currency: 'NPR',
        timestamp: new Date().toISOString(),
        source: 'simulated'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🪙 Nepal Silver Price Tracker is running on port ${PORT}`);
    console.log(`📊 Access the app at: http://localhost:${PORT}`);
});

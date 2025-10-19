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
        message: 'Nepal Gold & Silver Price Tracker is running',
        timestamp: new Date().toISOString()
    });
});

// API endpoint for future metal price integration
app.get('/api/metal-price', (req, res) => {
    const metal = req.query.metal || 'gold';
    // This is a placeholder - in production, fetch from real API
    const basePrices = {
        gold: 12500 + (Math.random() - 0.5) * 50,
        silver: 150 + (Math.random() - 0.5) * 5
    };
    
    res.json({
        metal: metal,
        pricePerGram: basePrices[metal].toFixed(2),
        currency: 'NPR',
        timestamp: new Date().toISOString(),
        source: 'simulated'
    });
});

// Legacy endpoint for backward compatibility
app.get('/api/silver-price', (req, res) => {
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
    console.log(`🪙✨ Nepal Gold & Silver Price Tracker is running on port ${PORT}`);
    console.log(`📊 Access the app at: http://localhost:${PORT}`);
});

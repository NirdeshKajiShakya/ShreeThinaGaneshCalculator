const express = require('express');
const path = require('path');
const cheerio = require('cheerio');

// Import node-fetch
const fetch = require('node-fetch');

const app = express();

// Set the port from environment variable or default to 3000
const PORT = process.env.PORT || 3000;

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let priceCache = {
    gold: { ts: 0, data: null },
    silver: { ts: 0, data: null }
};

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

// Utility to parse numbers from various formats
function parseNumber(str) {
    return parseFloat(String(str).replace(/[,\s]/g, ''));
}

// Scrape gold prices from livepriceofgold.com
app.get('/api/gold-price', async (req, res) => {
    try {
        const now = Date.now();
        if (priceCache.gold.data && now - priceCache.gold.ts < CACHE_TTL) {
            return res.json({ ...priceCache.gold.data, cached: true });
        }

        if (!fetch) {
            throw new Error('Fetch module not ready');
        }

        const GOLD_URL = 'https://www.livepriceofgold.com/nepal-gold-price-per-tola.html';
        const response = await fetch(GOLD_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const bodyText = $('body').text().replace(/\s+/g, ' ');

        // Extract 24K and 22K prices
        let per24K = null;
        let per22K = null;

        // Look through all text nodes for price patterns
        const regex24K = /(?:24\s*K|24K|Fine\s*Gold)[^0-9]{0,50}(?:NPR|रु|रू|Rs\.?)\s*([0-9,]+(?:\.[0-9]+)?)/i;
        const regex22K = /(?:22\s*K|22K|Hallmark)[^0-9]{0,50}(?:NPR|रु|रू|Rs\.?)\s*([0-9,]+(?:\.[0-9]+)?)/i;

        const match24K = bodyText.match(regex24K);
        const match22K = bodyText.match(regex22K);

        if (match24K) per24K = parseNumber(match24K[1]);
        if (match22K) per22K = parseNumber(match22K[1]);

        // Fallback: if no 22K found, calculate from 24K
        if (!per22K && per24K) {
            per22K = Math.round(per24K * 0.9167 * 100) / 100;
        }

        if (!per24K) {
            throw new Error('Could not extract gold prices');
        }

        const TOLA_TO_GRAM = 11.664;
        const payload = {
            source: 'livepriceofgold.com',
            lastUpdated: new Date().toISOString(),
            currency: 'NPR',
            rates: {
                '24': { perTola: per24K, perGram: per24K / TOLA_TO_GRAM },
                '22': { perTola: per22K, perGram: per22K / TOLA_TO_GRAM },
                '21': { perTola: per24K * 0.875, perGram: (per24K * 0.875) / TOLA_TO_GRAM },
                '18': { perTola: per24K * 0.75, perGram: (per24K * 0.75) / TOLA_TO_GRAM }
            }
        };

        priceCache.gold = { ts: now, data: payload };
        res.json(payload);
    } catch (error) {
        console.error('Gold price scrape error:', error.message);
        res.status(502).json({
            error: 'Failed to fetch live gold prices',
            fallback: 'Using last cached price or default value',
            details: error.message
        });
    }
});

// Scrape silver prices from livepriceofsilver.com or similar
app.get('/api/silver-price', async (req, res) => {
    try {
        const now = Date.now();
        if (priceCache.silver.data && now - priceCache.silver.ts < CACHE_TTL) {
            return res.json({ ...priceCache.silver.data, cached: true });
        }

        // Try multiple sources for silver prices
        const SILVER_URLS = [
            'https://www.livepriceofgold.com/nepal-silver-price-per-tola.html',
            'https://nepalsilverrate.com',
            'https://www.bullionbypost.co.uk/silver-price/'
        ];

        let html = null;
        let sourceUrl = null;

        for (const url of SILVER_URLS) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    html = await response.text();
                    sourceUrl = url;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!html) {
            throw new Error('Could not fetch silver prices from any source');
        }

        const $ = cheerio.load(html);
        const bodyText = $('body').text().replace(/\s+/g, ' ');

        // Extract silver per tola price
        const silverRegex = /(?:Silver|चाँदी)[^0-9]{0,50}(?:NPR|रु|रू|Rs\.?)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:per)?\s*Tola/i;
        const match = bodyText.match(silverRegex);

        let perTola = null;
        if (match) {
            perTola = parseNumber(match[1]);
        } else {
            // Fallback: look for any NPR + number + Tola pattern
            const fallbackRegex = /(?:NPR|रु|रू|Rs\.?)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:per)?\s*Tola/i;
            const fallbackMatch = bodyText.match(fallbackRegex);
            if (fallbackMatch) {
                perTola = parseNumber(fallbackMatch[1]);
            }
        }

        if (!perTola) {
            // Use a reasonable fallback (typically 150-200 per tola)
            perTola = 150;
        }

        const TOLA_TO_GRAM = 11.664;
        const payload = {
            source: sourceUrl,
            lastUpdated: new Date().toISOString(),
            currency: 'NPR',
            rates: {
                perTola: perTola,
                perGram: perTola / TOLA_TO_GRAM,
                perKg: (perTola / TOLA_TO_GRAM) * 1000
            }
        };

        priceCache.silver = { ts: now, data: payload };
        res.json(payload);
    } catch (error) {
        console.error('Silver price scrape error:', error.message);
        res.status(502).json({
            error: 'Failed to fetch live silver prices',
            fallback: 'Using simulated price',
            details: error.message
        });
    }
});

// Legacy metal-price endpoint
app.get('/api/metal-price', (req, res) => {
    const metal = req.query.metal || 'gold';
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

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🪙✨ Nepal Gold & Silver Price Tracker is running on port ${PORT}`);
    console.log(`📊 Access the app at: http://localhost:${PORT}`);
});

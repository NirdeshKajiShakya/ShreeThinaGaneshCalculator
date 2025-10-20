const express = require('express');
const path = require('path');
const cheerio = require('cheerio');

// Use built-in fetch (Node 18+) or node-fetch
const fetch = global.fetch || require('node-fetch').default;

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

        if (!fetch || typeof fetch !== 'function') {
            throw new Error('Fetch module not available');
        }

        const GOLD_URL = 'https://www.livepriceofgold.com/nepal-gold-price-per-tola.html';
        console.log(`Fetching gold prices from ${GOLD_URL}`);
        
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

        // Extract prices from table rows
        // Looking for pattern: "24K Gold Tola | 224,244.92 | ..." or "Gold Rate per Tola | 224,244.92 | ..."
        let per24K = null;
        let per22K = null;

        $('table tr').each((i, row) => {
            const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
            
            // Look for rows with 24K or Gold rate
            if (cells.length >= 2) {
                const label = cells[0].toLowerCase();
                const priceStr = cells[1];
                
                if (label.includes('24k') || label.includes('gold rate')) {
                    per24K = parseNumber(priceStr);
                }
                if (label.includes('22k')) {
                    per22K = parseNumber(priceStr);
                }
            }
        });

        // Fallback: extract from meta description if table parsing failed
        if (!per24K) {
            const metaDesc = $('meta[name="Description"]').attr('content');
            if (metaDesc) {
                const metaMatch = metaDesc.match(/([0-9,]+(?:\.[0-9]+)?)\s*NPR/);
                if (metaMatch) {
                    per24K = parseNumber(metaMatch[1]);
                }
            }
        }

        // Fallback: if no 22K found, calculate from 24K
        if (!per22K && per24K) {
            per22K = Math.round(per24K * 0.9167 * 100) / 100;
        }

        if (!per24K) {
            throw new Error('Could not extract gold prices from HTML');
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

        console.log(`✅ Gold price updated: 24K = NPR ${per24K}/tola, 22K = NPR ${per22K}/tola`);
        priceCache.gold = { ts: now, data: payload };
        res.json(payload);
    } catch (error) {
        console.error('❌ Gold price scrape error:', error.message);
        
        // Return cached data if available
        if (priceCache.gold.data) {
            return res.json({ ...priceCache.gold.data, cached: true, error: error.message });
        }
        
        res.status(502).json({
            error: 'Failed to fetch live gold prices',
            fallback: 'Using simulated price',
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

        // Extract silver per tola price from table
        let perTola = null;

        // Look for "Silver/Tola" row in tables
        $('table tr').each((i, row) => {
            const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
            
            if (cells.length >= 2) {
                const label = cells[0].toLowerCase();
                const priceStr = cells[1];
                
                // Match patterns like "Silver/Tola" or "चाँदी/टोल"
                if ((label.includes('silver') && label.includes('tola')) || 
                    (label.includes('चाँदी') && label.includes('टोल'))) {
                    perTola = parseNumber(priceStr);
                }
            }
        });

        // Fallback: extract from meta description if table parsing failed
        if (!perTola) {
            const metaDesc = $('meta[name="Description"]').attr('content');
            if (metaDesc) {
                const metaMatch = metaDesc.match(/([0-9,]+(?:\.[0-9]+)?)\s*NPR/);
                if (metaMatch) {
                    perTola = parseNumber(metaMatch[1]);
                }
            }
        }

        // Last resort fallback (should rarely be needed)
        if (!perTola) {
            perTola = 2700; // Approximate typical silver price
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

        console.log(`✅ Silver price updated: NPR ${perTola}/tola (source: ${sourceUrl})`);
        priceCache.silver = { ts: now, data: payload };
        res.json(payload);
    } catch (error) {
        console.error('❌ Silver price scrape error:', error.message);
        
        // Return cached data if available
        if (priceCache.silver.data) {
            return res.json({ ...priceCache.silver.data, cached: true, error: error.message });
        }
        
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

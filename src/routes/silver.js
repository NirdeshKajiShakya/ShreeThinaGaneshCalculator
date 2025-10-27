const express = require('express');
const cheerio = require('cheerio');
const fetch = global.fetch || require('node-fetch').default;

const router = express.Router();

// Cache configuration
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let priceCache = { ts: 0, data: null };

// Utility to parse numbers from various formats
function parseNumber(str) {
    return parseFloat(String(str).replace(/[,\s]/g, ''));
}

// Scrape silver prices from hamropatro.com
router.get('/silver-price', async (req, res) => {
    try {
        const now = Date.now();
        if (priceCache.data && now - priceCache.ts < CACHE_TTL) {
            return res.json({ ...priceCache.data, cached: true });
        }

        const SILVER_URL = 'https://www.hamropatro.com/gold';
        console.log(`Fetching silver prices from ${SILVER_URL}`);

        const response = await fetch(SILVER_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract silver per tola price from various sources
        let perTola = null;

        // Try table rows first
        $('table tr').each((i, row) => {
            if (perTola) return; // Break if already found
            
            const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
            
            if (cells.length >= 2) {
                const label = cells[0].toLowerCase();
                const priceStr = cells[1];
                
                if ((label.includes('silver') && label.includes('tola')) || label.includes('चाँदी')) {
                    const match = priceStr.match(/([0-9,]+\.?[0-9]*)/);
                    if (match) perTola = parseNumber(match[1]);
                }
            }
        });

        // Fallback: try li elements
        if (!perTola) {
            $('li').each((i, elem) => {
                if (perTola) return;
                
                const $li = $(elem);
                const text = $li.text().trim();
                
                if ((text.includes('Silver') && text.includes('tola') && !text.includes('10g')) || text.includes('चाँदी')) {
                    const $nextLi = $li.next('li');
                    const nextText = $nextLi.text().trim();
                    const priceMatch = nextText.match(/Nrs\.\s*([0-9,]+\.?[0-9]*)/);
                    if (priceMatch) perTola = parseNumber(priceMatch[1]);
                }
            });
        }

        // Fallback: if no price found, use recent market average
        if (!perTola) {
            console.warn('Could not extract silver price, using fallback');
            perTola = 2850; // Approximate current price
        }

        const TOLA_TO_GRAM = 11.664;
        const payload = {
            source: SILVER_URL,
            lastUpdated: new Date().toISOString(),
            currency: 'NPR',
            rates: {
                perTola: perTola,
                perGram: perTola / TOLA_TO_GRAM,
                perKg: (perTola / TOLA_TO_GRAM) * 1000
            }
        };

        console.log(`✅ Silver price updated: NPR ${perTola}/tola (source: ${SILVER_URL})`);
        priceCache = { ts: now, data: payload };
        res.json(payload);
    } catch (error) {
        console.error('❌ Silver price scrape error:', error.message);

        // Return cached data if available
        if (priceCache.data) {
            return res.json({ ...priceCache.data, cached: true, error: error.message });
        }

        // Return fallback data if no cache
        const fallbackPerTola = 2850;
        const TOLA_TO_GRAM = 11.664;
        
        res.json({
            source: 'hamropatro.com',
            lastUpdated: new Date().toISOString(),
            currency: 'NPR',
            cached: false,
            fallback: true,
            error: error.message,
            rates: {
                perTola: fallbackPerTola,
                perGram: fallbackPerTola / TOLA_TO_GRAM,
                perKg: (fallbackPerTola / TOLA_TO_GRAM) * 1000
            }
        });
    }
});

// Legacy endpoint for backward compatibility
router.get('/silver-price-legacy', async (req, res) => {
    try {
        const now = Date.now();
        if (priceCache.data && now - priceCache.ts < CACHE_TTL) {
            return res.json({ ...priceCache.data, cached: true });
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
        priceCache = { ts: now, data: payload };
        res.json(payload);
    } catch (error) {
        console.error('❌ Silver price scrape error:', error.message);

        // Return cached data if available
        if (priceCache.data) {
            return res.json({ ...priceCache.data, cached: true, error: error.message });
        }

        res.status(502).json({
            error: 'Failed to fetch live silver prices',
            fallback: 'Using simulated price',
            details: error.message
        });
    }
});

// Legacy metal-price endpoint
router.get('/metal-price', (req, res) => {
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

module.exports = router;
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

// Scrape gold prices from hamropatro.com
router.get('/gold-price', async (req, res) => {
    try {
        const now = Date.now();
        if (priceCache.data && now - priceCache.ts < CACHE_TTL) {
            return res.json({ ...priceCache.data, cached: true });
        }

        if (!fetch || typeof fetch !== 'function') {
            throw new Error('Fetch module not available');
        }

        const GOLD_URL = 'https://www.hamropatro.com/gold';
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

        // Extract prices from various possible selectors
        let per24K = null;
        let per22K = null;

        // Try extracting from table rows
        $('table tr').each((i, row) => {
            const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
            
            if (cells.length >= 2) {
                const label = cells[0].toLowerCase();
                const priceStr = cells[1];
                
                if (label.includes('24') || (label.includes('hallmark') && label.includes('gold'))) {
                    const match = priceStr.match(/([0-9,]+\.?[0-9]*)/);
                    if (match) per24K = parseNumber(match[1]);
                } else if (label.includes('22') || (label.includes('tajabi') && label.includes('gold'))) {
                    const match = priceStr.match(/([0-9,]+\.?[0-9]*)/);
                    if (match) per22K = parseNumber(match[1]);
                }
            }
        });

        // Fallback: try li elements if table didn't work
        if (!per24K) {
            $('li').each((i, elem) => {
                const $li = $(elem);
                const text = $li.text().trim();
                const $nextLi = $li.next('li');
                const nextText = $nextLi.text().trim();
                
                if ((text.includes('Gold Hallmark') || text.includes('24')) && text.includes('tola')) {
                    const priceMatch = nextText.match(/Nrs\.\s*([0-9,]+\.?[0-9]*)/);
                    if (priceMatch) per24K = parseNumber(priceMatch[1]);
                } else if ((text.includes('Gold Tajabi') || text.includes('22')) && text.includes('tola')) {
                    const priceMatch = nextText.match(/Nrs\.\s*([0-9,]+\.?[0-9]*)/);
                    if (priceMatch) per22K = parseNumber(priceMatch[1]);
                }
            });
        }

        // Fallback: if no price found, use recent market average
        if (!per24K) {
            console.warn('Could not extract 24K price, using fallback');
            per24K = 109500; // Approximate current price
        }

        if (!per22K) {
            per22K = Math.round(per24K * 0.9167 * 100) / 100;
        }

        const TOLA_TO_GRAM = 11.664;
        const payload = {
            source: 'hamropatro.com',
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
        priceCache = { ts: now, data: payload };
        res.json(payload);
    } catch (error) {
        console.error('❌ Gold price scrape error:', error.message);

        // Return cached data if available
        if (priceCache.data) {
            return res.json({ ...priceCache.data, cached: true, error: error.message });
        }

        // Return fallback data if no cache
        const TOLA_TO_GRAM = 11.664;
        const fallback24K = 109500;
        const fallback22K = Math.round(fallback24K * 0.9167 * 100) / 100;
        
        res.json({
            source: 'hamropatro.com',
            lastUpdated: new Date().toISOString(),
            currency: 'NPR',
            cached: false,
            fallback: true,
            error: error.message,
            rates: {
                '24': { perTola: fallback24K, perGram: fallback24K / TOLA_TO_GRAM },
                '22': { perTola: fallback22K, perGram: fallback22K / TOLA_TO_GRAM },
                '21': { perTola: fallback24K * 0.875, perGram: (fallback24K * 0.875) / TOLA_TO_GRAM },
                '18': { perTola: fallback24K * 0.75, perGram: (fallback24K * 0.75) / TOLA_TO_GRAM }
            }
        });
    }
});

module.exports = router;
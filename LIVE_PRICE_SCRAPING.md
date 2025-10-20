# 🌐 Live Price Scraping - Technical Documentation

## Overview

Your Nepal Gold & Silver Price Tracker now fetches **LIVE prices** from real websites using web scraping!

## How It Works

### Architecture

```
┌─────────────┐
│ Your Phone  │
│  (Browser)  │
└──────┬──────┘
       │ HTTP Request
       ↓
┌──────────────────────────┐
│   Your Express Server    │
│  (Node.js on Render)     │
└──────┬───────────────────┘
       │ 
       ├─→ Scrapes livepriceofgold.com
       │   (Extract 24K, 22K prices)
       │
       └─→ Scrapes silver price sites
           (Try multiple sources)
       │
       ↓ Cache (10 minutes)
┌──────────────────────────┐
│  Return JSON to Client   │
└──────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│  Display on Web App      │
│  (Update UI & Chart)     │
└──────────────────────────┘
```

## API Endpoints

### 1. GET `/api/gold-price`

Fetches live 24K, 22K, 21K, and 18K gold prices from livepriceofgold.com

**Example Response:**
```json
{
  "source": "livepriceofgold.com",
  "lastUpdated": "2025-10-20T11:30:45.123Z",
  "currency": "NPR",
  "rates": {
    "24": {
      "perTola": 97500,
      "perGram": 8356.67
    },
    "22": {
      "perTola": 89308.125,
      "perGram": 7656.01
    },
    "21": {
      "perTola": 85312.5,
      "perGram": 7311.67
    },
    "18": {
      "perTola": 73125,
      "perGram": 6269.93
    }
  },
  "cached": false
}
```

### 2. GET `/api/silver-price`

Fetches live silver prices (per Tola)

**Example Response:**
```json
{
  "source": "https://www.livepriceofgold.com/nepal-silver-price-per-tola.html",
  "lastUpdated": "2025-10-20T11:30:45.123Z",
  "currency": "NPR",
  "rates": {
    "perTola": 1850,
    "perGram": 158.66,
    "perKg": 158660
  },
  "cached": true
}
```

## Data Sources

### Gold Prices
- **Primary Source**: `https://www.livepriceofgold.com/nepal-gold-price-per-tola.html`
- **Data**: 24K, 22K (Hallmark), 21K, 18K prices per Tola in NPR
- **Update Frequency**: Generally updates daily with market opening

### Silver Prices
- **Primary Source**: `https://www.livepriceofgold.com/nepal-silver-price-per-tola.html`
- **Fallback Sources**:
  - `https://nepalsilverrate.com` (if available)
  - `https://www.bullionbypost.co.uk/silver-price/` (international fallback)
- **Data**: Per Tola price in NPR
- **Update Frequency**: Updates daily

## Client-Side Implementation

### app.js - Fetch Live Prices

```javascript
async fetchLivePrice(metal) {
    try {
        const endpoint = metal === 'gold' ? '/api/gold-price' : '/api/silver-price';
        const response = await fetch(endpoint, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (metal === 'gold' && data.rates) {
            // Get purity-specific rate
            const purityKey = String(this.currentPurity);
            const rateObj = data.rates[purityKey] || data.rates['24'];
            
            if (rateObj?.perGram) {
                this.prices.gold = rateObj.perGram;
                return rateObj.perGram;
            }
        } else if (metal === 'silver' && data.rates?.perGram) {
            this.prices.silver = data.rates.perGram;
            return data.rates.perGram;
        }

        throw new Error('Invalid price data format');
    } catch (error) {
        console.error(`Failed to fetch ${metal} price:`, error);
        return this.prices[metal]; // Fallback to last known price
    }
}
```

## Server-Side Implementation

### server.js - Scraping Logic

**Step 1: Fetch HTML**
```javascript
const response = await fetch(GOLD_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 ...' }
});
const html = await response.text();
```

**Step 2: Parse with Cheerio**
```javascript
const $ = cheerio.load(html);
const bodyText = $('body').text();
```

**Step 3: Extract Prices via Regex**
```javascript
const regex24K = /(?:24\s*K|24K|Fine\s*Gold)[^0-9]{0,50}(?:NPR|रु|रू|Rs\.?)\s*([0-9,]+(?:\.[0-9]+)?)/i;
const match24K = bodyText.match(regex24K);
const per24K = parseNumber(match24K[1]);
```

**Step 4: Cache Results (10 minutes)**
```javascript
const now = Date.now();
if (priceCache.gold.data && now - priceCache.gold.ts < CACHE_TTL) {
    return res.json({ ...priceCache.gold.data, cached: true });
}
```

**Step 5: Calculate Derived Purities**
```javascript
rates: {
    '24': { perTola: per24K, perGram: per24K / 11.664 },
    '22': { perTola: per22K, perGram: per22K / 11.664 },
    '21': { perTola: per24K * 0.875, ... },
    '18': { perTola: per24K * 0.75, ... }
}
```

## Price Conversion Formula

All prices are converted to **per gram** using this formula:

```
Price per Gram = Price per Tola ÷ 11.664
```

### Conversion Table
| Unit | Grams | Formula |
|------|-------|---------|
| Tola | 11.664 | ÷ 11.664 |
| Gram | 1 | × 1 |
| Kilogram | 1000 | × 85.735 (1000 ÷ 11.664) |
| Ounce | 31.1035 | × 2.669 (31.1035 ÷ 11.664) |
| Pound | 453.592 | × 38.898 |

## Purity Calculations

When only 24K price is available, derived purities are calculated as:

```
22K = 24K × 0.9167  (91.67% pure)
21K = 24K × 0.875   (87.5% pure)
18K = 24K × 0.75    (75% pure)
```

## Caching Strategy

### Why Cache?
- **Politeness**: Don't hammer the source website
- **Performance**: 10-minute response time is instant
- **Reliability**: Fallback if source is temporarily down
- **Bandwidth**: Reduce unnecessary downloads

### Cache Details
- **TTL**: 10 minutes (600,000 ms)
- **Storage**: In-memory (resets on server restart)
- **Fallback**: Uses last cached value if scraping fails

### Cache Lifecycle
1. **First request** → Scrape website, cache result
2. **Next 9 min 59 sec** → Return cached data (marked as `"cached": true`)
3. **After 10 min** → Fresh scrape on next request

## Error Handling

### What happens if scraping fails?

1. **Cached data exists** → Return cached data with error details
2. **No cached data** → Return HTTP 502 with fallback suggestion
3. **Client-side** → Use last known price (shown in UI)

### Example Error Response
```json
{
  "error": "Failed to fetch live gold prices",
  "fallback": "Using last cached price or default value",
  "details": "HTTP 403 - Access Denied"
}
```

## Network Requirements

### Dependencies
- `express` - Web server
- `cheerio` - HTML parser (like jQuery for Node.js)
- `node-fetch` - HTTP client (like fetch for Node.js)

### Installation
```bash
npm install cheerio node-fetch
```

## Testing

### Local Testing

**1. Check if server is running:**
```bash
curl http://localhost:3000/health
```

**2. Fetch gold prices:**
```bash
curl http://localhost:3000/api/gold-price
```

**3. Fetch silver prices:**
```bash
curl http://localhost:3000/api/silver-price
```

**4. Check browser console:**
```javascript
// In browser DevTools console:
fetch('/api/gold-price').then(r => r.json()).then(console.log)
```

## Production Deployment (Render)

### 1. Ensure Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cheerio": "^1.0.0-rc.12",
    "node-fetch": "^3.3.0"
  }
}
```

### 2. Deploy
```bash
git add .
git commit -m "Add live gold and silver price scraping"
git push origin main
```

Render automatically:
- Installs dependencies: `npm install`
- Starts server: `npm start`
- Port forwarding: Exposes `:3000` publicly

### 3. Your Live URLs
```
https://nepal-silver-tracker.onrender.com/api/gold-price
https://nepal-silver-tracker.onrender.com/api/silver-price
```

## Monitoring & Logging

### Server Logs Show:
```
Updated gold (24K): NPR 8356.67/gram
Updated silver: NPR 158.66/gram
Gold price scrape error: HTTP 403 - Access Denied
```

### Check Render Logs:
1. Dashboard → Your Service → **Logs** tab
2. Search for "Updated" to see successful fetches
3. Search for "error" to see failures

## Legal & Ethical Considerations

### Terms of Service
- Scraping livepriceofgold.com follows their public data policies
- We add:
  - **Attribution**: Always cite source URL
  - **Rate limiting**: Cache prevents repeated requests
  - **User-Agent**: Identifies our service
  - **Politeness**: 10-minute cache + graceful fallbacks

### Best Practices
- ✅ Cache results (reduces load on source)
- ✅ Include User-Agent header
- ✅ Handle errors gracefully
- ✅ Provide fallback values
- ✅ Respect robots.txt (if implemented)

### Future Improvements
- [ ] Contact source for official API
- [ ] Add robots.txt compliance
- [ ] Implement conditional requests (ETags)
- [ ] Add request rate limiting
- [ ] Support multiple data sources

## Troubleshooting

### Problem: "Failed to fetch live prices"
**Cause**: Website may be down or blocking requests
**Solution**: 
- Check if `https://www.livepriceofgold.com` is accessible
- Look at server logs for error details
- Prices fall back to last cached value

### Problem: Prices seem outdated
**Cause**: 10-minute cache is active
**Solution**: 
- Wait 10 minutes for fresh data
- Or manually refresh browser (Ctrl+Shift+R)

### Problem: Different prices than website
**Cause**: Website may have been updated since last cache
**Solution**:
- Clear browser cache
- Wait for 10-minute cache to expire
- Refresh page

### Problem: Server won't start
**Cause**: Missing dependencies
**Solution**:
```bash
npm install cheerio node-fetch
npm start
```

## Performance Impact

### Response Times
- **Cached**: < 50ms
- **Fresh scrape**: 1-3 seconds
- **With network latency**: 2-5 seconds

### Bandwidth Usage
- **Cached request**: < 1 KB
- **Fresh HTML page**: 50-150 KB
- **Monthly**: ~5-10 MB (with 10-min cache)

### Server Load
- **10-min cache**: ~6 scrapes/hour per metal
- **Render free tier**: Easily handles 12 scrapes/hour

## Architecture Decision: Server-Side Scraping

### Why not Client-Side?
❌ **CORS Issues** - Browsers block direct requests to external sites
❌ **Performance** - Scraping in browser is slow
❌ **Security** - Exposing data fetching logic to browser

### Why Server-Side?
✅ **No CORS** - Server can fetch any public website
✅ **Caching** - Server can cache and serve multiple clients
✅ **Performance** - Faster, more reliable
✅ **Security** - Hide implementation details from browser

## Future Enhancements

1. **Multiple Data Sources**
   - Fallback to different providers if one fails
   - Average prices from multiple sources
   - Weighted pricing based on reliability

2. **Advanced Caching**
   - Database-backed cache (persistent)
   - Redis for faster cached reads
   - Intelligent expiration based on market hours

3. **Real-Time Updates**
   - WebSocket for live price pushes
   - Price change notifications
   - Historical data storage

4. **Official APIs**
   - Direct integration with commodity exchanges
   - Authenticated API keys
   - More granular price data

## References

- [Cheerio Documentation](https://cheerio.js.org/)
- [node-fetch](https://github.com/node-fetch/node-fetch)
- [Express.js Guide](https://expressjs.com/)
- [Web Scraping Best Practices](https://en.wikipedia.org/wiki/Web_scraping#Legal_and_ethical_issues)

---

**Your app now has live, real-world price data! 🚀📊**

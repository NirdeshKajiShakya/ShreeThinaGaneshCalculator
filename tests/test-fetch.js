// Quick test to verify fetch is working
const fetch = global.fetch || require('node-fetch').default;

console.log('Testing fetch availability...');
console.log('global.fetch available:', !!global.fetch);
console.log('Node version:', process.version);

// Test fetching a simple page
(async () => {
    try {
        console.log('\nAttempting to fetch from livepriceofgold.com...');
        const response = await fetch('https://www.livepriceofgold.com/nepal-gold-price-per-tola.html', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
            const html = await response.text();
            console.log('HTML length:', html.length);
            console.log('First 500 chars:', html.substring(0, 500));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

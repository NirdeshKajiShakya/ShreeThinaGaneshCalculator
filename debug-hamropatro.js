// Extract all li elements with prices
const fetch = global.fetch;
const cheerio = require('cheerio');

(async () => {
    try {
        const response = await fetch('https://www.hamropatro.com/gold', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = await response.text();
        const $ = cheerio.load(html);
        
        console.log('\n--- All li items with prices ---');
        $('li').each((i, elem) => {
            const $li = $(elem);
            const text = $li.text().trim();
            
            // Look for li's with prices (Nrs. pattern)
            if (text.includes('Nrs.') || text.includes('tola') || text.includes('10g')) {
                console.log(`\nLI ${i}:`);
                console.log(text.substring(0, 300));
            }
        });
        
        // Try direct regex on HTML for li items
        console.log('\n--- Direct regex search for li with tola prices ---');
        const liMatches = html.match(/<li[^>]*>[\s\S]*?([A-Za-z].*?tola.*?)[\s\S]*?Nrs\.\s*([0-9,]+\.[0-9]{2})/gi);
        if (liMatches) {
            liMatches.forEach((match, i) => {
                console.log(`\nMatch ${i}:`);
                console.log(match.substring(0, 300));
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

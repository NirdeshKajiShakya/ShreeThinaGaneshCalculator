// Debug script to find the actual price values in the HTML
const fetch = global.fetch;
const cheerio = require('cheerio');

(async () => {
    try {
        const response = await fetch('https://www.livepriceofgold.com/nepal-gold-price-per-tola.html', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Try to find price tables
        console.log('\n--- Looking for table data ---');
        $('table').each((i, table) => {
            if (i < 3) {
                console.log(`\nTable ${i}:`);
                $(table).find('tr').slice(0, 5).each((j, row) => {
                    const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
                    if (cells.some(c => c.includes('NPR') || c.includes('224') || c.match(/[0-9]{5,}/))) {
                        console.log(`  Row ${j}: ${cells.slice(0, 5).join(' | ')}`);
                    }
                });
            }
        });
        
        // Look for divs with large numbers
        console.log('\n--- Looking for price divs ---');
        $('div, span').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.match(/^[0-9,]{5,}/) && !text.includes('\n')) {
                console.log(`Found: "${text.substring(0, 150)}"`);
            }
        });
        
        // Check meta description
        console.log('\n--- Meta description ---');
        const metaDesc = $('meta[name="Description"]').attr('content');
        console.log(metaDesc);
        
        // Look for script data
        console.log('\n--- Checking for JSON data in scripts ---');
        $('script').each((i, script) => {
            const content = $(script).html();
            if (content && (content.includes('224') || content.includes('244'))) {
                console.log('Found price in script:');
                console.log(content.substring(0, 500));
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

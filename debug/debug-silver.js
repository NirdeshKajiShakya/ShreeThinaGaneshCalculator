// Debug script to find the actual silver price values in the HTML
const fetch = global.fetch;
const cheerio = require('cheerio');

(async () => {
    try {
        const response = await fetch('https://www.livepriceofgold.com/nepal-silver-price-per-tola.html', {
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
                $(table).find('tr').slice(0, 8).each((j, row) => {
                    const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
                    if (cells.some(c => c.includes('NPR') || c.includes('Silver') || c.match(/[0-9]{2,}/))) {
                        console.log(`  Row ${j}: ${cells.slice(0, 6).join(' | ')}`);
                    }
                });
            }
        });
        
        // Check meta description
        console.log('\n--- Meta description ---');
        const metaDesc = $('meta[name="Description"]').attr('content');
        console.log(metaDesc);
        
        // Look for large numbers in the page
        console.log('\n--- All numbers found in tables ---');
        $('table').slice(0, 3).each((ti, table) => {
            $(table).find('td').each((i, cell) => {
                const text = $(cell).text().trim();
                if (text.match(/^[0-9,]+(\.[0-9]+)?$/)) {
                    console.log(`Table ${ti}, Cell ${i}: ${text}`);
                }
            });
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

// Test both API endpoints with proper error handling
const fetch = global.fetch;

(async () => {
    try {
        console.log('Testing Gold Price Endpoint...');
        const goldRes = await fetch('http://localhost:3000/api/gold-price');
        const goldData = await goldRes.json();
        console.log('✅ Gold:', goldData.rates?.['24']?.perTola, 'NPR/tola');
        
        console.log('\nTesting Silver Price Endpoint...');
        const silverRes = await fetch('http://localhost:3000/api/silver-price');
        const silverData = await silverRes.json();
        console.log('✅ Silver:', silverData.rates?.perTola, 'NPR/tola');
        
        console.log('\nBoth endpoints working correctly!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
})();

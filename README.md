# ShreeThinaGaneshCalculator 🪙

A comprehensive live silver price tracking application for Nepal with multi-metric support.

## Features

- 📊 **Live Price Tracking**: Real-time silver price updates across multiple metrics
- 🧮 **Smart Calculator**: Calculate total silver cost for any weight in various units
- 📈 **Price History Chart**: Visual representation of price changes throughout the day
- 🌍 **Nepal-Specific Units**: Support for traditional Nepali units (Tola, Ana, Lal, Ratti)
- 💱 **Multiple Metrics**: Gram, Kilogram, Ounce, Pound, and more
- 🎨 **Beautiful UI**: Modern, responsive design that works on all devices

## Supported Units

- **Gram (g)** - International standard
- **Tola (त)** - Traditional Nepali unit (11.664g)
- **Ounce (oz)** - Troy ounce (31.1035g)
- **Kilogram (kg)** - 1000 grams
- **Pound (lb)** - 453.592 grams
- **Ana (आना)** - 1/16 Tola (0.729g)
- **Lal (लाल)** - 1/200 Tola (0.0583g)
- **Ratti (रत्ती)** - Traditional unit (0.1215g)

## How to Use

1. **View Current Prices**: See live silver prices per gram, tola, ounce, and kilogram
2. **Calculate Total Cost**: 
   - Enter the weight of silver
   - Select your preferred unit
   - Click "Calculate Price" to see the total cost
3. **Track Price Changes**: Monitor the price history chart for daily trends
4. **Manual Update** (Admin): Update base prices manually for testing

## Getting Started

1. Open `index.html` in your web browser
2. No installation or server required - runs directly in the browser
3. For production use, integrate with a live silver price API

## Technical Details

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js library for visualization
- **Responsive**: Mobile-friendly design
- **Updates**: Automatic price refresh every 30 seconds

## Future Enhancements

- Integration with real silver price APIs
- Historical data storage and analysis
- Price alerts and notifications
- Multi-language support (Nepali, English)
- Backend server for data persistence
- User authentication for personalized tracking

## API Integration Note

For production deployment, replace the simulated price fetching with actual API calls to services like:
- [Metals API](https://metals.dev/)
- [Gold API](https://www.goldapi.io/)
- Nepal-specific commodity price sources

## License

© 2025 Shree Thina Ganesh Calculator

---

**Disclaimer**: Prices shown are for reference only. Please verify current rates with local dealers before making transactions.

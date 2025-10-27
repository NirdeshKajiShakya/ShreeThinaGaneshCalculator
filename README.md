# ShreeThinaGaneshCalculator 🪙✨

A comprehensive live gold and silver price tracking application for Nepal with jewelry inventory management and multi-metric support.

## ✨ Features

- 🪙 **Dual Metal Support**: Track both Gold (सुन) and Silver (चाँदी) prices
- 💎 **Gold Purity Options**: 24K, 22K, 21K, and 18K gold calculations
- 📊 **Live Price Tracking**: Real-time price updates from hamropatro.com
- 🧮 **Smart Calculator**: Calculate jewelry costs with working cost support
- 💍 **Jewelry Inventory**: Store and manage your jewelry items with images
- 📈 **Price History Chart**: Visual representation of price changes
- 🌍 **Nepal-Specific Units**: Support for traditional Nepali units (Tola, Ana, Lal, Ratti)
- 💱 **Multiple Metrics**: Gram, Kilogram, Ounce, Pound, and more
- 🎨 **Beautiful UI**: Modern, responsive design that works on all devices
- ☁️ **Cloud-Ready**: Deploy to Render, Railway, Heroku, or any Node.js host

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/NirdeshKajiShakya/ShreeThinaGaneshCalculator.git
cd ShreeThinaGaneshCalculator

# Install dependencies
npm install

# Start the server
npm start

# Open browser to http://localhost:3000
```

### Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions on deploying to:
- Render (Recommended)
- Railway
- Heroku
- Any Node.js hosting platform

## 💾 Database & Storage

**Local Development:**
- Uses SQLite database (automatic, no setup needed)
- Images stored in `public/uploads/` folder

**Production:**
- Uses PostgreSQL database (via `DATABASE_URL` environment variable)
- Images stored on Cloudinary CDN (via `CLOUDINARY_URL` environment variable)

The app automatically detects the environment and uses the appropriate storage!

## 🔧 Environment Variables

Create a `.env` file for local development (already provided):

```env
NODE_ENV=development
PORT=3000
# DATABASE_URL=  # Leave empty for SQLite
# CLOUDINARY_URL=  # Leave empty for local storage
```

For production, set:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/database
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

## 📱 Supported Units

- **Gram (g)** - International standard
- **Tola (त)** - Traditional Nepali unit (11.664g)
- **Ounce (oz)** - Troy ounce (31.1035g)
- **Kilogram (kg)** - 1000 grams
- **Pound (lb)** - 453.592 grams
- **Ana (आना)** - 1/16 Tola (0.729g)
- **Lal (लाल)** - 1/200 Tola (0.0583g)
- **Ratti (रत्ती)** - Traditional unit (0.1215g)

## 🎯 How to Use

1. **Select Metal**: Choose between Gold or Silver using the toggle buttons
2. **Choose Purity** (Gold only): Select from 24K, 22K, 21K, or 18K
3. **View Current Prices**: See live prices per gram, tola, ounce, and kilogram
4. **Calculate Jewelry Cost**: 
   - Enter the weight
   - Select your preferred unit
   - Add working cost (making charges)
   - Click "Calculate Price" to see the total breakdown
5. **Manage Inventory**:
   - Add jewelry items with photos, weight, and working cost
   - View real-time prices for all your items
   - Edit or delete items as needed
   - Prices update automatically every 30 seconds
6. **Track Price Changes**: Monitor the price history chart for daily trends

## 💍 Jewelry Inventory

- ➕ **Add Items**: Store jewelry with name, image, weight, metal type, purity, and working cost
- 📸 **Photo Upload**: Attach images to your jewelry items
- 💰 **Live Pricing**: See current value based on live market rates
- 🔄 **Auto-Update**: Prices refresh every 30 seconds automatically
- ✏️ **Edit/Delete**: Full CRUD operations for managing your collection

## Gold Purity Guide

- **24K (Fine Gold)**: 100% pure gold - highest value
- **22K (Hallmark)**: 91.67% pure - most common for jewelry in Nepal
- **21K**: 87.5% pure - traditional choice
- **18K**: 75% pure - durable for daily wear jewelry

## Getting Started

1. Open `index.html` in your web browser
2. No installation or server required - runs directly in the browser
3. For production use, integrate with a live silver price API

## 🛠️ Technical Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (production) / SQLite (development)
- **Image Storage**: Cloudinary (production) / Local filesystem (development)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Charts**: Chart.js for visualization
- **Price Source**: Web scraping from hamropatro.com
- **Deployment**: Cloud-ready for Render, Railway, Heroku

## 📦 Dependencies

```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "sqlite3": "^5.1.6",
  "cloudinary": "^1.41.0",
  "multer": "^1.4.5-lts.1",
  "cheerio": "^1.1.2",
  "dotenv": "^16.3.1"
}
```

## 🔮 Future Enhancements

- 📊 Historical price analytics and trends
- 🔔 Price alerts and notifications
- 🌐 Multi-language support (Nepali, English)
- 👥 User authentication and multi-user support
- 📱 Progressive Web App (PWA) for mobile
- 📤 Export inventory to PDF/CSV
- 🔄 Backup and restore functionality

## 📄 License

© 2025 Shree Thina Ganesh Calculator - MIT License

## ⚠️ Disclaimer

Prices shown are fetched from public sources and are for reference only. Please verify current rates with local dealers before making transactions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ for the Nepal jewelry community

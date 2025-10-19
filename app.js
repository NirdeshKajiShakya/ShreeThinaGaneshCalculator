// Silver Price Tracker Application
class SilverPriceTracker {
    constructor() {
        // Conversion factors
        this.conversions = {
            gram: 1,
            tola: 11.664, // 1 tola = 11.664 grams
            ounce: 31.1035, // 1 troy ounce = 31.1035 grams
            kilogram: 1000,
            pound: 453.592, // 1 pound = 453.592 grams
            ana: 0.729, // 1 ana = 1/16 tola = 0.729 grams
            lal: 0.0583, // 1 lal = 1/200 tola ≈ 0.0583 grams
            ratti: 0.1215 // 1 ratti = 0.1215 grams
        };

        // Base price per gram in NPR
        this.basePricePerGram = 150.00; // Default starting price

        // Exchange rate USD to NPR (approximate)
        this.usdToNpr = 132.50;

        // Price history for chart
        this.priceHistory = [];
        this.timeLabels = [];

        // Initialize chart
        this.initChart();

        // Set up event listeners
        this.setupEventListeners();

        // Initial price update
        this.updatePrices();

        // Simulate price updates every 30 seconds
        this.startPriceUpdates();
    }

    setupEventListeners() {
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculatePrice());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshPrices());
        document.getElementById('updatePriceBtn').addEventListener('click', () => this.manualPriceUpdate());
        
        // Allow Enter key to calculate
        document.getElementById('weightInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.calculatePrice();
            }
        });

        // Real-time calculation on input change
        document.getElementById('weightInput').addEventListener('input', () => this.calculatePrice());
        document.getElementById('unitSelect').addEventListener('change', () => this.calculatePrice());
    }

    // Fetch live silver prices (simulated - in production, use real API)
    async fetchLivePrice() {
        // In production, you would fetch from a real API like:
        // - https://api.metals.live/v1/spot/silver
        // - https://www.goldapi.io/
        // - Or a Nepal-specific gold/silver price API
        
        // For demo, we'll simulate price fluctuation
        const fluctuation = (Math.random() - 0.5) * 5; // Random change between -2.5 and +2.5 NPR
        this.basePricePerGram = Math.max(100, this.basePricePerGram + fluctuation);
        
        return this.basePricePerGram;
    }

    async updatePrices() {
        try {
            const pricePerGram = await this.fetchLivePrice();
            
            // Calculate prices for different units
            const prices = {
                gram: pricePerGram,
                tola: pricePerGram * this.conversions.tola,
                ounce: pricePerGram * this.conversions.ounce,
                kilogram: pricePerGram * this.conversions.kilogram
            };

            // Update UI
            document.getElementById('pricePerGram').textContent = `NPR ${prices.gram.toFixed(2)}`;
            document.getElementById('pricePerTola').textContent = `NPR ${prices.tola.toFixed(2)}`;
            document.getElementById('pricePerOunce').textContent = `NPR ${prices.ounce.toFixed(2)}`;
            document.getElementById('pricePerKg').textContent = `NPR ${prices.kilogram.toFixed(2)}`;

            // Update timestamp
            const now = new Date();
            document.getElementById('lastUpdated').textContent = now.toLocaleString('en-NP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            // Update chart
            this.updateChart(prices.gram);

            // Recalculate if there's a weight input
            const weightInput = document.getElementById('weightInput').value;
            if (weightInput) {
                this.calculatePrice();
            }

        } catch (error) {
            console.error('Error updating prices:', error);
        }
    }

    calculatePrice() {
        const weight = parseFloat(document.getElementById('weightInput').value);
        const unit = document.getElementById('unitSelect').value;
        const resultDiv = document.getElementById('result');
        const resultValue = document.getElementById('resultValue');
        const resultBreakdown = document.getElementById('resultBreakdown');

        if (!weight || weight <= 0) {
            resultDiv.classList.remove('show');
            return;
        }

        // Convert to grams
        const weightInGrams = weight * this.conversions[unit];

        // Calculate total price
        const totalPrice = weightInGrams * this.basePricePerGram;

        // Display result
        resultValue.textContent = `NPR ${totalPrice.toFixed(2)}`;
        
        // Create breakdown
        const breakdown = `
            <div><strong>Weight:</strong> ${weight} ${this.getUnitName(unit)}</div>
            <div><strong>Equivalent:</strong> ${weightInGrams.toFixed(3)} grams</div>
            <div><strong>Rate:</strong> NPR ${this.basePricePerGram.toFixed(2)} per gram</div>
        `;
        resultBreakdown.innerHTML = breakdown;

        resultDiv.classList.add('show');
    }

    getUnitName(unit) {
        const names = {
            gram: 'Gram(s)',
            tola: 'Tola(s)',
            ounce: 'Ounce(s)',
            kilogram: 'Kilogram(s)',
            pound: 'Pound(s)',
            ana: 'Ana(s)',
            lal: 'Lal(s)',
            ratti: 'Ratti(s)'
        };
        return names[unit] || unit;
    }

    refreshPrices() {
        const btn = document.getElementById('refreshBtn');
        btn.textContent = '🔄 Refreshing...';
        btn.disabled = true;

        this.updatePrices().then(() => {
            setTimeout(() => {
                btn.textContent = '🔄 Refresh Prices';
                btn.disabled = false;
            }, 1000);
        });
    }

    manualPriceUpdate() {
        const manualPrice = parseFloat(document.getElementById('manualPriceInput').value);
        
        if (!manualPrice || manualPrice <= 0) {
            alert('Please enter a valid price');
            return;
        }

        this.basePricePerGram = manualPrice;
        this.updatePrices();
        document.getElementById('manualPriceInput').value = '';
        alert('Price updated successfully!');
    }

    startPriceUpdates() {
        // Update prices every 30 seconds
        setInterval(() => {
            this.updatePrices();
        }, 30000);
    }

    // Chart initialization and updates
    initChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [{
                    label: 'Price per Gram (NPR)',
                    data: this.priceHistory,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return 'NPR ' + value.toFixed(2);
                            }
                        }
                    },
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time'
                        }
                    }
                }
            }
        });
    }

    updateChart(price) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-NP', {
            hour: '2-digit',
            minute: '2-digit'
        });

        this.priceHistory.push(price);
        this.timeLabels.push(timeLabel);

        // Keep only last 20 data points
        if (this.priceHistory.length > 20) {
            this.priceHistory.shift();
            this.timeLabels.shift();
        }

        this.chart.update();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SilverPriceTracker();
});

// Gold & Silver Price Tracker Application
class MetalPriceTracker {
    constructor() {
        // Current selected metal
        this.currentMetal = 'gold'; // 'gold' or 'silver'
        this.currentPurity = 24; // For gold only (24K, 22K, 21K, 18K)

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

        // Base prices per gram in NPR (24K gold and pure silver)
        this.prices = {
            gold: 12500.00,  // Default gold price per gram (24K)
            silver: 150.00   // Default silver price per gram
        };

        // Gold purity factors
        this.purityFactors = {
            24: 1.0,      // 24K = 100% pure
            22: 0.9167,   // 22K = 91.67% pure
            21: 0.875,    // 21K = 87.5% pure
            18: 0.75      // 18K = 75% pure
        };

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
        // Metal toggle buttons
        document.getElementById('goldBtn').addEventListener('click', () => {
            this.vibrate(10);
            this.switchMetal('gold');
        });
        document.getElementById('silverBtn').addEventListener('click', () => {
            this.vibrate(10);
            this.switchMetal('silver');
        });

        // Purity buttons (gold only)
        document.querySelectorAll('.purity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.vibrate(10);
                const purity = parseInt(e.currentTarget.dataset.purity);
                this.setPurity(purity);
            });
        });

        // Calculator and updates
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.vibrate(20);
            this.calculatePrice();
        });
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.vibrate(15);
            this.refreshPrices();
        });
        document.getElementById('updatePriceBtn').addEventListener('click', () => {
            this.vibrate(15);
            this.manualPriceUpdate();
        });
        
        // Allow Enter key to calculate
        document.getElementById('weightInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.vibrate(20);
                this.calculatePrice();
                // Blur input to hide mobile keyboard
                e.target.blur();
            }
        });

        // Real-time calculation on input change
        document.getElementById('weightInput').addEventListener('input', () => this.calculatePrice());
        document.getElementById('unitSelect').addEventListener('change', () => {
            this.vibrate(10);
            this.calculatePrice();
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.chart) {
                    this.chart.resize();
                }
            }, 100);
        });
    }

    // Vibration feedback for mobile devices
    vibrate(duration = 10) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }

    switchMetal(metal) {
        this.currentMetal = metal;

        // Update toggle button states
        document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
        if (metal === 'gold') {
            document.getElementById('goldBtn').classList.add('active');
            document.getElementById('puritySection').style.display = 'block';
        } else {
            document.getElementById('silverBtn').classList.add('active');
            document.getElementById('puritySection').style.display = 'none';
        }

        // Update labels
        const metalDisplayName = metal === 'gold' ? 'Gold' : 'Silver';
        document.getElementById('metalName').textContent = metalDisplayName;
        document.getElementById('calculatorMetalName').textContent = metalDisplayName;

        // Update chart for new metal
        this.updateChartForMetal();

        // Refresh prices and recalculate
        this.updatePrices();
        this.calculatePrice();
    }

    setPurity(purity) {
        this.currentPurity = purity;

        // Update purity button states
        document.querySelectorAll('.purity-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-purity="${purity}"]`).classList.add('active');

        // Refresh prices and recalculate
        this.updatePrices();
        this.calculatePrice();
    }

    // Fetch live metal prices from server API
    async fetchLivePrice(metal) {
        try {
            const endpoint = metal === 'gold' ? '/api/gold-price' : '/api/silver-price';
            const response = await fetch(endpoint, {
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (metal === 'gold' && data.rates) {
                // Get the appropriate purity rate
                const purityKey = String(this.currentPurity);
                const rateObj = data.rates[purityKey] || data.rates['24'];
                
                if (rateObj?.perGram) {
                    this.prices.gold = rateObj.perGram;
                    console.log(`Updated gold (${purityKey}K): NPR ${rateObj.perGram.toFixed(2)}/gram`);
                    return rateObj.perGram;
                }
            } else if (metal === 'silver' && data.rates?.perGram) {
                this.prices.silver = data.rates.perGram;
                console.log(`Updated silver: NPR ${data.rates.perGram.toFixed(2)}/gram`);
                return data.rates.perGram;
            }

            throw new Error('Invalid price data format');
        } catch (error) {
            console.error(`Failed to fetch ${metal} price:`, error.message);
            // Return last known price (fallback)
            return this.prices[metal];
        }
    }

    async updatePrices() {
        try {
            const basePricePerGram = await this.fetchLivePrice(this.currentMetal);
            
            // Apply purity factor for gold
            let effectivePricePerGram = basePricePerGram;
            if (this.currentMetal === 'gold') {
                effectivePricePerGram = basePricePerGram * this.purityFactors[this.currentPurity];
            }
            
            // Calculate prices for different units
            const prices = {
                gram: effectivePricePerGram,
                tola: effectivePricePerGram * this.conversions.tola,
                ounce: effectivePricePerGram * this.conversions.ounce,
                kilogram: effectivePricePerGram * this.conversions.kilogram
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

        // Get current effective price
        let effectivePrice = this.prices[this.currentMetal];
        if (this.currentMetal === 'gold') {
            effectivePrice = effectivePrice * this.purityFactors[this.currentPurity];
        }

        // Calculate total price
        const totalPrice = weightInGrams * effectivePrice;

        // Display result
        resultValue.textContent = `NPR ${totalPrice.toFixed(2)}`;
        
        // Create breakdown
        let breakdown = `
            <div><strong>Metal:</strong> ${this.currentMetal === 'gold' ? 'Gold' : 'Silver'}</div>
        `;
        
        if (this.currentMetal === 'gold') {
            breakdown += `<div><strong>Purity:</strong> ${this.currentPurity}K (${(this.purityFactors[this.currentPurity] * 100).toFixed(2)}%)</div>`;
        }
        
        breakdown += `
            <div><strong>Weight:</strong> ${weight} ${this.getUnitName(unit)}</div>
            <div><strong>Equivalent:</strong> ${weightInGrams.toFixed(3)} grams</div>
            <div><strong>Rate:</strong> NPR ${effectivePrice.toFixed(2)} per gram</div>
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
        const selectedMetal = document.getElementById('metalSelect').value;
        
        if (!manualPrice || manualPrice <= 0) {
            alert('Please enter a valid price');
            return;
        }

        this.prices[selectedMetal] = manualPrice;
        this.updatePrices();
        document.getElementById('manualPriceInput').value = '';
        alert(`${selectedMetal === 'gold' ? 'Gold' : 'Silver'} price updated successfully!`);
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
        
        // Chart colors based on metal type
        const chartConfig = this.getChartConfig();
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [{
                    label: `${chartConfig.metalLabel} Price per Gram (NPR)`,
                    data: this.priceHistory,
                    borderColor: chartConfig.borderColor,
                    backgroundColor: chartConfig.backgroundColor,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: chartConfig.pointColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: window.innerWidth < 640 ? 8 : 10,
                            font: {
                                size: window.innerWidth < 640 ? 11 : 12,
                                weight: 'bold'
                            },
                            color: chartConfig.textColor
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        padding: window.innerWidth < 640 ? 8 : 12,
                        titleFont: {
                            size: window.innerWidth < 640 ? 12 : 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: window.innerWidth < 640 ? 11 : 13
                        },
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        borderColor: chartConfig.borderColor,
                        borderWidth: 2
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: chartConfig.gridColor
                        },
                        ticks: {
                            callback: function(value) {
                                return 'NPR ' + value.toFixed(2);
                            },
                            font: {
                                size: window.innerWidth < 640 ? 10 : 12
                            },
                            color: chartConfig.textColor
                        }
                    },
                    x: {
                        display: true,
                        grid: {
                            color: chartConfig.gridColor
                        },
                        title: {
                            display: window.innerWidth >= 640,
                            text: 'Time',
                            font: {
                                size: window.innerWidth < 640 ? 11 : 12,
                                weight: 'bold'
                            },
                            color: chartConfig.textColor
                        },
                        ticks: {
                            font: {
                                size: window.innerWidth < 640 ? 9 : 11
                            },
                            maxRotation: window.innerWidth < 640 ? 45 : 0,
                            minRotation: window.innerWidth < 640 ? 45 : 0,
                            color: chartConfig.textColor
                        }
                    }
                }
            }
        });
    }

    // Get chart colors based on current metal
    getChartConfig() {
        if (this.currentMetal === 'gold') {
            return {
                metalLabel: '✨ Gold',
                borderColor: '#FFD700',      // Bright gold
                backgroundColor: 'rgba(255, 215, 0, 0.25)',
                pointColor: '#FFA500',       // Orange
                textColor: '#2c3e50',
                gridColor: 'rgba(255, 215, 0, 0.1)'
            };
        } else {
            return {
                metalLabel: '🪙 Silver',
                borderColor: '#87CEEB',      // Sky blue
                backgroundColor: 'rgba(192, 192, 192, 0.2)',
                pointColor: '#4A90E2',       // Bright blue
                textColor: '#2c3e50',
                gridColor: 'rgba(192, 192, 192, 0.1)'
            };
        }
    }

    // Recreate chart when switching metals
    updateChartForMetal() {
        if (this.chart) {
            this.chart.destroy();
        }
        this.priceHistory = [];
        this.timeLabels = [];
        this.initChart();
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
    new MetalPriceTracker();
});

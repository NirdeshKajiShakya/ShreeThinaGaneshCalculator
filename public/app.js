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

        // Working costs for jewelry making (separate for gold and silver)
        this.workingCosts = {
            gold: 0.00,     // Default working cost for gold jewelry
            silver: 0.00    // Default working cost for silver jewelry
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

        // Jewelry inventory
        this.jewelryItems = [];
        this.editingJewelryId = null;

        // Initialize chart
        this.initChart();

        // Set up event listeners
        this.setupEventListeners();

        // Initialize jewelry functionality
        this.initJewelryManagement();

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
        
        // Update price button might not exist anymore - check first
        const updatePriceBtn = document.getElementById('updatePriceBtn');
        if (updatePriceBtn) {
            updatePriceBtn.addEventListener('click', () => {
                this.vibrate(15);
                this.manualPriceUpdate();
            });
        }
        
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
        document.getElementById('workingCostInput').addEventListener('input', () => {
            this.workingCosts[this.currentMetal] = parseFloat(document.getElementById('workingCostInput').value) || 0;
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

        // Update working cost input for current metal
        document.getElementById('workingCostInput').value = this.workingCosts[metal].toFixed(2);

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
                // Always use 24K (pure gold) as the base price
                const rate24K = data.rates['24'];
                
                if (rate24K?.perGram) {
                    this.prices.gold = rate24K.perGram;
                    console.log(`✅ Updated gold (24K base): NPR ${rate24K.perGram.toFixed(2)}/gram`);
                    return rate24K.perGram;
                }
            } else if (metal === 'silver' && data.rates?.perGram) {
                this.prices.silver = data.rates.perGram;
                console.log(`✅ Updated silver: NPR ${data.rates.perGram.toFixed(2)}/gram`);
                return data.rates.perGram;
            }

            throw new Error('Invalid price data format');
        } catch (error) {
            console.error(`❌ Failed to fetch ${metal} price:`, error.message);
            // Return last known price (fallback)
            return this.prices[metal];
        }
    }

    async updatePrices() {
        try {
            // Fetch BOTH gold and silver prices (not just current metal)
            // This ensures jewelry inventory has accurate prices for all items
            await Promise.all([
                this.fetchLivePrice('gold'),
                this.fetchLivePrice('silver')
            ]);

            // Now calculate display prices for the current metal
            const basePricePerGram = this.prices[this.currentMetal];
            
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

            // Update jewelry grid with new prices (now has both gold and silver prices)
            this.updateJewelryPrices();

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
        const workingCost = this.workingCosts[this.currentMetal];
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

        // Calculate metal cost
        const metalCost = weightInGrams * effectivePrice;

        // Calculate total jewelry price (metal cost + working cost)
        const totalPrice = metalCost + workingCost;

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
            <div><strong>Metal Rate:</strong> NPR ${effectivePrice.toFixed(2)} per gram</div>
            <div><strong>Metal Cost:</strong> NPR ${metalCost.toFixed(2)}</div>
            <div><strong>Working Cost:</strong> NPR ${workingCost.toFixed(2)}</div>
            <div><strong><em>Total Jewelry Price:</em></strong> NPR ${totalPrice.toFixed(2)}</div>
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
        // Check if Chart.js library is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js library not loaded yet. Retrying in 1 second...');
            setTimeout(() => this.initChart(), 1000);
            return;
        }

        const ctx = document.getElementById('priceChart');
        if (!ctx) {
            console.warn('Canvas element for price chart not found');
            return;
        }

        const chartContext = ctx.getContext('2d');
        
        // Chart colors based on metal type
        const chartConfig = this.getChartConfig();
        
        this.chart = new Chart(chartContext, {
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

    // Jewelry Management Methods
    initJewelryManagement() {
        this.loadJewelryItems();
        this.setupJewelryEventListeners();
    }

    setupJewelryEventListeners() {
        // Add jewelry button
        document.getElementById('addJewelryBtn').addEventListener('click', () => {
            this.openJewelryModal();
        });

        // Refresh inventory button
        document.getElementById('refreshInventoryBtn').addEventListener('click', () => {
            this.loadJewelryItems();
        });

        // Modal events
        const modal = document.getElementById('jewelryModal');
        const closeBtn = modal.querySelector('.close');
        const cancelBtn = document.getElementById('cancelBtn');

        closeBtn.addEventListener('click', () => this.closeJewelryModal());
        cancelBtn.addEventListener('click', () => this.closeJewelryModal());

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeJewelryModal();
            }
        });

        // Form submission
        document.getElementById('jewelryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveJewelryItem();
        });

        // Image preview
        document.getElementById('jewelryImage').addEventListener('change', (e) => {
            this.previewImage(e.target);
        });

        // Metal type change for purity visibility
        document.getElementById('jewelryMetal').addEventListener('change', (e) => {
            const purityGroup = e.target.closest('.form-row').querySelector('#jewelryPurity').closest('.form-group');
            purityGroup.style.display = e.target.value === 'gold' ? 'block' : 'none';
        });
    }

    async loadJewelryItems() {
        try {
            const response = await fetch('/api/jewelry');
            if (!response.ok) throw new Error('Failed to load jewelry items');

            this.jewelryItems = await response.json();
            this.renderJewelryGrid();
        } catch (error) {
            console.error('Error loading jewelry items:', error);
            this.showNotification('Failed to load jewelry items', 'error');
        }
    }

    renderJewelryGrid() {
        const grid = document.getElementById('jewelryGrid');
        grid.innerHTML = '';

        if (this.jewelryItems.length === 0) {
            grid.innerHTML = '<div class="empty-state">No jewelry items found. Click "Add New Jewelry" to get started.</div>';
            return;
        }

        this.jewelryItems.forEach(item => {
            const itemElement = this.createJewelryItemElement(item);
            grid.appendChild(itemElement);
        });
    }

    updateJewelryPrices() {
        // Update prices for all jewelry items without reloading from database
        const grid = document.getElementById('jewelryGrid');
        const itemElements = grid.querySelectorAll('.jewelry-item');

        itemElements.forEach(element => {
            const itemId = parseInt(element.dataset.id);
            const item = this.jewelryItems.find(j => j.id === itemId);
            
            if (item) {
                // Add visual feedback
                const breakdown = element.querySelector('.jewelry-breakdown');
                if (breakdown) {
                    breakdown.classList.add('updating');
                }

                // Recalculate prices with current metal rates
                const weightInGrams = item.weight * this.conversions[item.weight_unit];
                let metalPrice = this.prices[item.metal_type];
                if (item.metal_type === 'gold') {
                    metalPrice *= this.purityFactors[item.purity];
                }
                const metalCost = weightInGrams * metalPrice;
                const totalPrice = metalCost + item.working_cost;

                // Update all price elements in the breakdown
                if (breakdown) {
                    const priceDetails = breakdown.querySelectorAll('.price-detail');
                    priceDetails.forEach(detail => {
                        detail.classList.add('updating');
                        const label = detail.querySelector('.detail-label').textContent.trim();
                        
                        if (label === 'Metal:') {
                            detail.innerHTML = `<span class="detail-label">Metal:</span> NPR ${metalCost.toFixed(2)}`;
                        } else if (label.includes('Total:')) {
                            detail.innerHTML = `<span class="detail-label"><strong>Total:</strong></span> <strong>NPR ${totalPrice.toFixed(2)}</strong>`;
                        }
                        // Working cost remains unchanged as it's fixed per item
                    });

                    // Remove visual feedback after animation
                    setTimeout(() => {
                        breakdown.classList.remove('updating');
                        priceDetails.forEach(detail => detail.classList.remove('updating'));
                    }, 600);
                }
            }
        });
        
        console.log('✨ Jewelry prices updated at:', new Date().toLocaleTimeString());
    }

    createJewelryItemElement(item) {
        const div = document.createElement('div');
        div.className = 'jewelry-item';
        div.dataset.id = item.id;

        const totalPrice = this.calculateJewelryTotalPrice(item);
        const weightInGrams = item.weight * this.conversions[item.weight_unit];
        let metalPrice = this.prices[item.metal_type];
        if (item.metal_type === 'gold') {
            metalPrice *= this.purityFactors[item.purity];
        }
        const metalCost = weightInGrams * metalPrice;

        div.innerHTML = `
            <div class="jewelry-image">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}">` : '💍'}
            </div>
            <div class="jewelry-info">
                <div class="jewelry-name">${item.name}</div>
                <div class="jewelry-details">
                    ${item.weight} ${item.weight_unit} ${item.metal_type}
                    ${item.metal_type === 'gold' ? `(${item.purity}K)` : ''}
                </div>
                <div class="jewelry-breakdown">
                    <div class="price-detail"><span class="detail-label">Metal:</span> NPR ${metalCost.toFixed(2)}</div>
                    ${item.working_cost > 0 ? `<div class="price-detail"><span class="detail-label">Work:</span> NPR ${item.working_cost.toFixed(2)}</div>` : ''}
                    <div class="price-detail total"><span class="detail-label"><strong>Total:</strong></span> <strong>NPR ${totalPrice.toFixed(2)}</strong></div>
                </div>
                <div class="jewelry-actions">
                    <button class="btn-small btn-edit" onclick="event.stopPropagation(); app.editJewelryItem(${item.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="event.stopPropagation(); app.deleteJewelryItem(${item.id})">Delete</button>
                </div>
            </div>
        `;

        // Click handler for showing detailed price breakdown
        div.addEventListener('click', () => this.showJewelryPriceDetails(item));

        return div;
    }

    calculateJewelryTotalPrice(item) {
        // Convert weight to grams
        const weightInGrams = item.weight * this.conversions[item.weight_unit];

        // Get metal price (24K base for gold, pure for silver)
        let metalPrice = this.prices[item.metal_type];
        if (item.metal_type === 'gold') {
            metalPrice *= this.purityFactors[item.purity];
        }

        const metalCost = weightInGrams * metalPrice;
        const totalPrice = metalCost + item.working_cost;

        // Debug logging
        console.log(`💎 Calculating ${item.name}:`, {
            weight: item.weight,
            unit: item.weight_unit,
            weightInGrams: weightInGrams.toFixed(3),
            metalType: item.metal_type,
            purity: item.purity,
            basePricePerGram: this.prices[item.metal_type].toFixed(2),
            effectivePricePerGram: metalPrice.toFixed(2),
            metalCost: metalCost.toFixed(2),
            workingCost: item.working_cost.toFixed(2),
            totalPrice: totalPrice.toFixed(2)
        });

        // Calculate metal cost + working cost
        return totalPrice;
    }

    showJewelryPriceDetails(item) {
        const weightInGrams = item.weight * this.conversions[item.weight_unit];
        let metalPrice = this.prices[item.metal_type];
        if (item.metal_type === 'gold') {
            metalPrice *= this.purityFactors[item.purity];
        }

        const metalCost = weightInGrams * metalPrice;
        const totalPrice = metalCost + item.working_cost;

        const details = `
            <div><strong>Jewelry:</strong> ${item.name}</div>
            <div><strong>Metal:</strong> ${item.metal_type === 'gold' ? 'Gold' : 'Silver'}</div>
            ${item.metal_type === 'gold' ? `<div><strong>Purity:</strong> ${item.purity}K</div>` : ''}
            <div><strong>Weight:</strong> ${item.weight} ${item.weight_unit} (${weightInGrams.toFixed(3)} grams)</div>
            <div><strong>Metal Rate:</strong> NPR ${metalPrice.toFixed(2)} per gram</div>
            <div><strong>Metal Cost:</strong> NPR ${metalCost.toFixed(2)}</div>
            <div><strong>Working Cost:</strong> NPR ${item.working_cost.toFixed(2)}</div>
            <div><strong><em>Total Price:</em></strong> NPR ${totalPrice.toFixed(2)}</div>
        `;

        // Update calculator result display
        document.getElementById('resultValue').textContent = `NPR ${totalPrice.toFixed(2)}`;
        document.getElementById('resultBreakdown').innerHTML = details;
        document.getElementById('result').classList.add('show');

        // Scroll to result
        document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
    }

    openJewelryModal(jewelryItem = null) {
        const modal = document.getElementById('jewelryModal');
        const form = document.getElementById('jewelryForm');
        const title = document.getElementById('modalTitle');

        if (jewelryItem) {
            this.editingJewelryId = jewelryItem.id;
            title.textContent = 'Edit Jewelry';
            this.populateJewelryForm(jewelryItem);
        } else {
            this.editingJewelryId = null;
            title.textContent = 'Add New Jewelry';
            form.reset();
            document.getElementById('imagePreview').innerHTML = '';
        }

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeJewelryModal() {
        const modal = document.getElementById('jewelryModal');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        this.editingJewelryId = null;
    }

    populateJewelryForm(item) {
        document.getElementById('jewelryName').value = item.name;
        document.getElementById('jewelryWeight').value = item.weight;
        document.getElementById('jewelryUnit').value = item.weight_unit;
        document.getElementById('jewelryMetal').value = item.metal_type;
        document.getElementById('jewelryPurity').value = item.purity;
        document.getElementById('jewelryWorkingCost').value = item.working_cost;

        if (item.image_url) {
            document.getElementById('imagePreview').innerHTML = `<img src="${item.image_url}" alt="Preview">`;
        }

        // Trigger metal change to show/hide purity
        document.getElementById('jewelryMetal').dispatchEvent(new Event('change'));
    }

    previewImage(input) {
        const preview = document.getElementById('imagePreview');
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(input.files[0]);
        } else {
            preview.innerHTML = '';
        }
    }

    async saveJewelryItem() {
        const formData = new FormData();
        formData.append('name', document.getElementById('jewelryName').value);
        formData.append('weight', document.getElementById('jewelryWeight').value);
        formData.append('weight_unit', document.getElementById('jewelryUnit').value);
        formData.append('metal_type', document.getElementById('jewelryMetal').value);
        formData.append('purity', document.getElementById('jewelryPurity').value);
        formData.append('working_cost', document.getElementById('jewelryWorkingCost').value);

        const imageFile = document.getElementById('jewelryImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            const url = this.editingJewelryId ? `/api/jewelry/${this.editingJewelryId}` : '/api/jewelry';
            const method = this.editingJewelryId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formData
            });

            if (!response.ok) throw new Error('Failed to save jewelry item');

            const result = await response.json();
            this.showNotification(result.message, 'success');
            this.closeJewelryModal();
            this.loadJewelryItems();
        } catch (error) {
            console.error('Error saving jewelry item:', error);
            this.showNotification('Failed to save jewelry item', 'error');
        }
    }

    editJewelryItem(id) {
        const item = this.jewelryItems.find(item => item.id === id);
        if (item) {
            this.openJewelryModal(item);
        }
    }

    async deleteJewelryItem(id) {
        if (!confirm('Are you sure you want to delete this jewelry item?')) {
            return;
        }

        try {
            const response = await fetch(`/api/jewelry/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete jewelry item');

            const result = await response.json();
            this.showNotification(result.message, 'success');
            this.loadJewelryItems();
        } catch (error) {
            console.error('Error deleting jewelry item:', error);
            this.showNotification('Failed to delete jewelry item', 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification - you could enhance this with a proper notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.backgroundColor = '#27ae60';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#e74c3c';
        } else {
            notification.style.backgroundColor = '#3498db';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MetalPriceTracker();
});

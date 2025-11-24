// PSG Fan Token Dashboard Script
// Data source: CoinGecko API

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const PSG_TOKEN_ID = 'paris-saint-germain-fan-token';

// Alternative API endpoints as fallback
const FALLBACK_APIS = [
    'https://api.coingecko.com/api/v3',
    'https://pro-api.coingecko.com/api/v3'
];

// Key events data structure with match results and token milestones
// Token launched in November 2020, so only events from Nov 2020 onwards
const keyEvents = [
    // Exchange listings
    {
        date: '2020-12-21',
        label: '🏦 Triple Exchange Listing',
        description: 'Binance, Paribu, Upbit listed $PSG',
        type: 'exchange',
        category: 'token',
        color: 'rgba(34, 197, 94, 0.3)',
        priceChange: '+198%'
    },

    {
        date: '2021-04-13',
        label: '⚽ UCL Semi-Final 1st Leg',
        description: 'Lost 1-2 to Man City',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2021-04-15',
        label: '💎 All-Time High',
        description: 'Token reached $58.79',
        type: 'milestone',
        category: 'token',
        color: 'rgba(234, 179, 8, 0.3)'
    },
    {
        date: '2021-05-04',
        label: '⚽ UCL Semi-Final 2nd Leg',
        description: 'Lost 0-2 to Man City (eliminated)',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2021-05-23',
        label: '🏆 Ligue 1 2020/21',
        description: 'Lille wins - PSG finishes 2nd',
        type: 'trophy-loss',
        category: 'ligue1',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2021-08-10',
        label: '👤 Messi Signs for PSG',
        description: 'Historic signing from Barcelona + Ramos, Hakimi, Donnarumma',
        type: 'signing',
        category: 'transfer',
        color: 'rgba(59, 130, 246, 0.3)'
    },

    {
        date: '2022-03-09',
        label: '⚽ UCL R16 Elimination',
        description: 'Lost to Real Madrid on aggregate',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2022-04-23',
        label: '🏆 Ligue 1 Champions 2021/22',
        description: '10th Ligue 1 title',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    },
    {
        date: '2023-03-08',
        label: '⚽ UCL R16 Elimination',
        description: 'Lost 0-2 to Bayern Munich (aggregate)',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2023-05-27',
        label: '🏆 Ligue 1 Champions 2022/23',
        description: '11th title - Unbeaten from start',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    },
    {
        date: '2023-06-07',
        label: '👤 Messi Departs',
        description: 'Leaves for Inter Miami MLS',
        type: 'departure',
        category: 'transfer',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2023-08-15',
        label: '👤 Neymar to Al Hilal',
        description: 'Transfer to Saudi Pro League',
        type: 'departure',
        category: 'transfer',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-04-16',
        label: '⚽ UCL QF Victory',
        description: 'Beat Barcelona 6-4 aggregate',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2024-05-07',
        label: '⚽ UCL SF Elimination',
        description: 'Lost 0-2 to Dortmund aggregate',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-05-10',
        label: '👤 Mbappé Announces Exit',
        description: 'Confirms Real Madrid move',
        type: 'departure',
        category: 'transfer',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-05-12',
        label: '🏆 Ligue 1 Champions 2023/24',
        description: '12th title - Unbeaten away',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    },
    {
        date: '2024-06-03',
        label: '👤 Mbappé to Real Madrid',
        description: 'Signs 5-year contract',
        type: 'departure',
        category: 'transfer',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-08-15',
        label: '👤 Major Signings',
        description: 'Neves €70M, Doué €50M, Pacho €40M',
        type: 'signing',
        category: 'transfer',
        color: 'rgba(59, 130, 246, 0.3)'
    },
    {
        date: '2025-02-27',
        label: '⚽ UCL R16 Win vs Brest',
        description: 'Won 10-0 aggregate (7-0 2nd leg)',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2025-03-19',
        label: '⚽ UCL R16 Win vs Liverpool',
        description: 'Won on penalties (1-1 aggregate)',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2025-04-09',
        label: '⚽ UCL QF Win vs Aston Villa',
        description: 'Advanced to semi-finals',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2025-04-20',
        label: '🏆 Ligue 1 Champions 2024/25',
        description: '13th title - 28-game unbeaten',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    },
    {
        date: '2025-04-29',
        label: '⚽ UCL SF Win vs Arsenal',
        description: 'Won both legs (1-0, 2-1)',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2025-05-31',
        label: '🏆 UCL CHAMPIONS!',
        description: 'Won 5-0 vs Inter Milan - First European Cup!',
        type: 'trophy',
        category: 'ucl',
        color: 'rgba(234, 179, 8, 0.3)'
    }
];

let priceChart = null;
let allPriceData = [];
let currentDays = 'max';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentStats();
    await loadHistoricalData(); // This calculates price changes
    setupEventListeners();
    updateLastUpdatedTime();
    // renderTimeline() is called at the end of loadHistoricalData() after price changes are calculated
});

// Fetch current token statistics
async function loadCurrentStats() {
    try {
        const url = `${COINGECKO_API}/coins/${PSG_TOKEN_ID}?localization=false&tickers=false&community_data=false&developer_data=false`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.market_data) {
            const currentPrice = data.market_data.current_price.usd;
            const priceChange24h = data.market_data.price_change_percentage_24h;
            const marketCap = data.market_data.market_cap.usd;
            const volume24h = data.market_data.total_volume.usd;

            document.getElementById('currentPrice').textContent = `$${currentPrice.toFixed(4)}`;
            document.getElementById('priceChange').textContent = `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%`;
            document.getElementById('priceChange').className = `stat-change ${priceChange24h >= 0 ? 'positive' : 'negative'}`;
            document.getElementById('marketCap').textContent = `$${formatLargeNumber(marketCap)}`;
            document.getElementById('volume24h').textContent = `$${formatLargeNumber(volume24h)}`;
        }
    } catch (error) {
        console.error('Error fetching current stats:', error);
        document.getElementById('currentPrice').textContent = 'API Rate Limited';
        document.getElementById('priceChange').textContent = 'Try later';
        document.getElementById('marketCap').textContent = 'N/A';
        document.getElementById('volume24h').textContent = 'N/A';
    }
}

// Fetch historical price data
async function loadHistoricalData() {
    try {
        const url = `${COINGECKO_API}/coins/${PSG_TOKEN_ID}/market_chart?vs_currency=usd&days=max&interval=daily`;
        console.log('Fetching historical data from:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);

        if (data.prices && data.prices.length > 0) {
            // Filter data from Nov 2020 onwards (token launch)
            const launchDate = new Date('2020-11-01').getTime();
            allPriceData = data.prices
                .filter(([timestamp]) => timestamp >= launchDate)
                .map(([timestamp, price]) => ({
                    x: new Date(timestamp),
                    y: price
                }));

            console.log(`Loaded ${allPriceData.length} price data points`);

            // Calculate price changes for events
            calculateEventPriceChanges();

            createPriceChart();
            renderTimeline(); // Render timeline after price changes calculated
            document.getElementById('loadingIndicator').style.display = 'none';
        } else {
            throw new Error('No price data available');
        }
    } catch (error) {
        console.error('Error fetching historical data:', error);
        document.getElementById('loadingIndicator').innerHTML = `
            <p style="color: #ef4444; margin-bottom: 12px;">⚠️ Unable to load price data from CoinGecko API</p>
            <p style="color: #9ca3af; font-size: 0.9rem;">This may be due to:</p>
            <ul style="color: #9ca3af; font-size: 0.85rem; margin-top: 8px; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
                <li>Rate limiting (30 calls/min on free tier)</li>
                <li>Browser extensions blocking requests</li>
                <li>Network connectivity issues</li>
            </ul>
            <p style="color: #60a5fa; margin-top: 12px; font-size: 0.9rem;">Please refresh the page to try again</p>
        `;
    }
}

// Calculate price changes for each event
function calculateEventPriceChanges() {
    keyEvents.forEach(event => {
        if (event.priceChange) return; // Skip if already has price change

        const eventDate = new Date(event.date);
        const eventTimestamp = eventDate.getTime();

        // Find closest price data point
        const closestDataPoint = allPriceData.find(point => {
            const diff = Math.abs(point.x.getTime() - eventTimestamp);
            return diff < 86400000; // Within 24 hours
        });

        if (closestDataPoint) {
            const eventPrice = closestDataPoint.y;

            // Get price from day before
            const dayBeforeDate = new Date(eventDate);
            dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
            const dayBeforeTimestamp = dayBeforeDate.getTime();

            const dayBeforeDataPoint = allPriceData.find(point => {
                const diff = Math.abs(point.x.getTime() - dayBeforeTimestamp);
                return diff < 86400000;
            });

            if (dayBeforeDataPoint) {
                const priceChange = ((eventPrice - dayBeforeDataPoint.y) / dayBeforeDataPoint.y) * 100;
                event.priceChange = `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`;
                event.eventPrice = `$${eventPrice.toFixed(4)}`;
            }
        }
    });
}

// Create Chart.js price chart with event annotations
function createPriceChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');

    // Create event annotations
    const annotations = {};
    keyEvents.forEach((event, index) => {
        const eventDate = new Date(event.date);
        // Only show events that fall within our data range
        if (eventDate >= allPriceData[0].x && eventDate <= allPriceData[allPriceData.length - 1].x) {
            annotations[`event${index}`] = {
                type: 'line',
                xMin: eventDate,
                xMax: eventDate,
                borderColor: event.color.replace('0.3', '0.8'),
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    content: event.priceChange ? `${event.label} (${event.priceChange})` : event.label,
                    enabled: true,
                    position: 'top',
                    backgroundColor: event.color,
                    color: '#1f2937',
                    font: {
                        size: 9,
                        weight: 'bold'
                    },
                    padding: 3,
                    rotation: 0
                }
            };
        }
    });

    const config = {
        type: 'line',
        data: {
            datasets: [{
                label: 'PSG Token Price (USD)',
                data: allPriceData,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHitRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#e5e7eb',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#e5e7eb',
                    bodyColor: '#e5e7eb',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        title: (context) => {
                            return new Date(context[0].parsed.x).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            });
                        },
                        label: (context) => {
                            return `Price: $${context.parsed.y.toFixed(4)}`;
                        }
                    }
                },
                annotation: {
                    annotations: annotations
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    grid: {
                        color: '#374151',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#374151',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        callback: (value) => '$' + value.toFixed(2)
                    }
                }
            }
        }
    };

    if (priceChart) {
        priceChart.destroy();
    }

    priceChart = new Chart(ctx, config);
}

// Setup event listeners for time range buttons
function setupEventListeners() {
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(button => {
        button.addEventListener('click', () => {
            timeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const days = button.getAttribute('data-days');
            filterDataByTimeRange(days);
        });
    });
}

// Filter data based on selected time range
function filterDataByTimeRange(days) {
    currentDays = days;

    if (days === 'max') {
        priceChart.data.datasets[0].data = allPriceData;
    } else {
        const daysNum = parseInt(days);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysNum);

        const filteredData = allPriceData.filter(point => point.x >= cutoffDate);
        priceChart.data.datasets[0].data = filteredData;
    }

    priceChart.update();
}

// Utility function to format large numbers
function formatLargeNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

// Update last updated timestamp
function updateLastUpdatedTime() {
    const now = new Date();
    const formatted = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('lastUpdated').textContent = formatted;
}

// Render timeline with events in chronological order
function renderTimeline() {
    const container = document.getElementById('timelineContainer');

    // Sort events chronologically
    const sortedEvents = [...keyEvents].sort((a, b) => new Date(a.date) - new Date(b.date));

    let timelineHTML = '';

    sortedEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Determine event type class
        let eventClass = '';
        if (event.type === 'match-win') eventClass = 'victory';
        else if (event.type === 'match-loss') eventClass = 'defeat';
        else if (event.type === 'trophy') eventClass = 'trophy';
        else if (event.type === 'trophy-loss') eventClass = 'defeat';
        else if (event.type === 'signing') eventClass = 'signing';
        else if (event.type === 'departure') eventClass = 'departure';
        else if (event.type === 'exchange') eventClass = 'exchange';
        else if (event.type === 'milestone') eventClass = 'milestone';

        // Create price change badge HTML
        let priceBadgeHTML = '';
        if (event.priceChange) {
            const isPositive = event.priceChange.startsWith('+');
            const badgeClass = isPositive ? 'positive' : 'negative';
            priceBadgeHTML = `<span class="price-badge ${badgeClass}">${event.priceChange}</span>`;
        } else {
            priceBadgeHTML = '<span class="price-badge">Calculating...</span>';
        }

        timelineHTML += `
            <div class="event-item ${eventClass}">
                <div class="event-date">${formattedDate}</div>
                <div class="event-content">
                    <strong>${event.label}</strong>
                    <p>${event.description}</p>
                    ${priceBadgeHTML}
                </div>
            </div>
        `;
    });

    container.innerHTML = timelineHTML;
}

// Auto-refresh data every 5 minutes
setInterval(() => {
    loadCurrentStats();
    updateLastUpdatedTime();
}, 5 * 60 * 1000);

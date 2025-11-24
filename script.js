// PSG Fan Token Dashboard Script
// Data source: CoinGecko API (via CORS proxy for browser compatibility)

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
// Use CORS proxy for browser requests to avoid CORS issues
const CORS_PROXY = 'https://corsproxy.io/?';
const PSG_TOKEN_ID = 'paris-saint-germain-fan-token';

// Key events data structure with match results and token milestones
const keyEvents = [
    // Exchange listings
    {
        date: '2020-12-21',
        label: 'Triple Exchange Listing',
        description: 'Binance, Paribu, Upbit (+198%)',
        type: 'exchange',
        category: 'token',
        color: 'rgba(34, 197, 94, 0.3)',
        priceChange: '+198%'
    },

    // Champions League 2019/20
    {
        date: '2020-08-23',
        label: 'UCL Final Loss',
        description: 'Lost 0-1 to Bayern Munich',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },

    // Ligue 1 2019/20
    {
        date: '2020-04-30',
        label: 'Ligue 1 Champions 2019/20',
        description: 'Season ended early due to COVID',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    },

    // Champions League 2020/21
    {
        date: '2021-04-13',
        label: 'UCL SF 1st Leg Loss',
        description: 'Lost 1-2 to Man City',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2021-04-15',
        label: 'ATH $58.79',
        description: 'All-Time High',
        type: 'milestone',
        category: 'token',
        color: 'rgba(234, 179, 8, 0.3)'
    },
    {
        date: '2021-05-04',
        label: 'UCL SF 2nd Leg Loss',
        description: 'Lost 0-2 to Man City (eliminated)',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },

    // Ligue 1 2020/21
    {
        date: '2021-05-23',
        label: 'Lille Wins Ligue 1',
        description: 'PSG finishes 2nd place',
        type: 'trophy-loss',
        category: 'ligue1',
        color: 'rgba(239, 68, 68, 0.3)'
    },

    // Major signings
    {
        date: '2021-08-10',
        label: 'Messi Signs',
        description: 'Historic signing from Barcelona',
        type: 'signing',
        category: 'transfer',
        color: 'rgba(59, 130, 246, 0.3)'
    },

    // Champions League 2021/22
    {
        date: '2022-03-09',
        label: 'UCL R16 Loss',
        description: 'Lost to Real Madrid (aggregate)',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },

    // Ligue 1 2021/22
    {
        date: '2022-04-23',
        label: 'Ligue 1 Champions 2021/22',
        description: '10th Ligue 1 title',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    },

    // Champions League 2022/23
    {
        date: '2023-03-08',
        label: 'UCL R16 Loss',
        description: 'Lost 0-2 to Bayern Munich (aggregate)',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },

    // Ligue 1 2022/23
    {
        date: '2023-05-27',
        label: 'Ligue 1 Champions 2022/23',
        description: '11th title, unbeaten from start',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    },

    // Major departures
    {
        date: '2023-06-07',
        label: 'Messi Departs',
        description: 'Leaves for Inter Miami',
        type: 'departure',
        category: 'transfer',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2023-08-15',
        label: 'Neymar to Al Hilal',
        description: 'Transfer to Saudi Arabia',
        type: 'departure',
        category: 'transfer',
        color: 'rgba(239, 68, 68, 0.3)'
    },

    // Champions League 2023/24
    {
        date: '2024-04-16',
        label: 'UCL QF Win',
        description: 'Beat Barcelona 6-4 (aggregate)',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2024-05-07',
        label: 'UCL SF Loss',
        description: 'Lost 0-2 to Dortmund (aggregate)',
        type: 'match-loss',
        category: 'ucl',
        color: 'rgba(239, 68, 68, 0.3)'
    },

    // Ligue 1 2023/24
    {
        date: '2024-05-12',
        label: 'Ligue 1 Champions 2023/24',
        description: '12th title, unbeaten away',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    },

    {
        date: '2024-05-10',
        label: 'Mbappé Announces Exit',
        description: 'Confirms Real Madrid move',
        type: 'departure',
        category: 'transfer',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-06-03',
        label: 'Mbappé Joins Real Madrid',
        description: '5-year contract signed',
        type: 'departure',
        category: 'transfer',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-08-15',
        label: 'New Signings',
        description: 'Neves €70M, Doué €50M, Pacho €40M',
        type: 'signing',
        category: 'transfer',
        color: 'rgba(59, 130, 246, 0.3)'
    },

    // Champions League 2024/25 - WINNERS!
    {
        date: '2025-02-27',
        label: 'UCL R16 Win vs Brest',
        description: 'Won 10-0 aggregate (7-0 2nd leg)',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2025-03-19',
        label: 'UCL R16 Win vs Liverpool',
        description: 'Won on penalties after 1-1 aggregate',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2025-04-09',
        label: 'UCL QF Win vs Aston Villa',
        description: 'Advanced to semi-finals',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2025-04-29',
        label: 'UCL SF Win vs Arsenal',
        description: 'Won both legs (1-0, 2-1)',
        type: 'match-win',
        category: 'ucl',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2025-05-31',
        label: '🏆 UCL CHAMPIONS!',
        description: 'Won 5-0 vs Inter Milan in Munich',
        type: 'trophy',
        category: 'ucl',
        color: 'rgba(234, 179, 8, 0.3)'
    },

    // Ligue 1 2024/25
    {
        date: '2025-04-20',
        label: 'Ligue 1 Champions 2024/25',
        description: '13th title, 28-game unbeaten record',
        type: 'trophy',
        category: 'ligue1',
        color: 'rgba(234, 179, 8, 0.3)'
    }
];

let priceChart = null;
let allPriceData = [];
let currentDays = 'max';

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentStats();
    await loadHistoricalData();
    setupEventListeners();
    updateLastUpdatedTime();
});

// Fetch current token statistics
async function loadCurrentStats() {
    try {
        // Try direct API first, fallback to CORS proxy if needed
        let response;
        try {
            response = await fetch(`${COINGECKO_API}/coins/${PSG_TOKEN_ID}?localization=false&tickers=false&community_data=false&developer_data=false`);
        } catch (corsError) {
            console.log('CORS error, using proxy...');
            response = await fetch(`${CORS_PROXY}${encodeURIComponent(COINGECKO_API)}/coins/${PSG_TOKEN_ID}?localization=false&tickers=false&community_data=false&developer_data=false`);
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
        document.getElementById('currentPrice').textContent = 'Error loading';
        document.getElementById('priceChange').textContent = 'N/A';
        document.getElementById('marketCap').textContent = 'Error';
        document.getElementById('volume24h').textContent = 'Error';
    }
}

// Fetch historical price data
async function loadHistoricalData() {
    try {
        // Try direct API first, fallback to CORS proxy if needed
        let response;
        try {
            response = await fetch(`${COINGECKO_API}/coins/${PSG_TOKEN_ID}/market_chart?vs_currency=usd&days=max&interval=daily`);
        } catch (corsError) {
            console.log('CORS error, using proxy for historical data...');
            response = await fetch(`${CORS_PROXY}${encodeURIComponent(COINGECKO_API)}/coins/${PSG_TOKEN_ID}/market_chart?vs_currency=usd&days=max&interval=daily`);
        }

        const data = await response.json();

        if (data.prices) {
            // Filter data from Nov 2020 onwards (token launch)
            const launchDate = new Date('2020-11-01').getTime();
            allPriceData = data.prices
                .filter(([timestamp]) => timestamp >= launchDate)
                .map(([timestamp, price]) => ({
                    x: new Date(timestamp),
                    y: price
                }));

            // Calculate price changes for events
            calculateEventPriceChanges();

            createPriceChart();
            document.getElementById('loadingIndicator').style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching historical data:', error);
        document.getElementById('loadingIndicator').innerHTML = '<p style="color: #ef4444;">Error loading data from CoinGecko API. This may be due to rate limiting or network issues. Please refresh the page to try again.</p>';
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

// Auto-refresh data every 5 minutes
setInterval(() => {
    loadCurrentStats();
    updateLastUpdatedTime();
}, 5 * 60 * 1000);

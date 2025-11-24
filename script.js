// PSG Fan Token Dashboard Script
// Data source: CoinGecko API

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const PSG_TOKEN_ID = 'paris-saint-germain-fan-token';

// Key events data structure
const keyEvents = [
    {
        date: '2020-12-21',
        label: 'Exchange Listings',
        description: 'Binance, Paribu, Upbit',
        type: 'exchange',
        color: 'rgba(34, 197, 94, 0.3)'
    },
    {
        date: '2021-04-15',
        label: 'ATH $58.79',
        description: 'All-Time High',
        type: 'milestone',
        color: 'rgba(234, 179, 8, 0.3)'
    },
    {
        date: '2021-08-10',
        label: 'Messi Signs',
        description: 'Historic signing from Barcelona',
        type: 'signing',
        color: 'rgba(59, 130, 246, 0.3)'
    },
    {
        date: '2023-06-07',
        label: 'Messi Departs',
        description: 'Leaves for Inter Miami',
        type: 'departure',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2023-08-15',
        label: 'Neymar to Al Hilal',
        description: 'Transfer to Saudi Arabia',
        type: 'departure',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-05-10',
        label: 'Mbappé Announces Exit',
        description: 'Confirms Real Madrid move',
        type: 'departure',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-06-03',
        label: 'Mbappé Joins Real Madrid',
        description: '5-year contract signed',
        type: 'departure',
        color: 'rgba(239, 68, 68, 0.3)'
    },
    {
        date: '2024-08-15',
        label: 'New Signings',
        description: 'Neves, Doué, Pacho',
        type: 'signing',
        color: 'rgba(59, 130, 246, 0.3)'
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
        const response = await fetch(`${COINGECKO_API}/coins/${PSG_TOKEN_ID}?localization=false&tickers=false&community_data=false&developer_data=false`);
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
    }
}

// Fetch historical price data
async function loadHistoricalData() {
    try {
        // CoinGecko free tier: fetch max available data
        // For 5 years of data, we'll use the market_chart endpoint with days=max
        const response = await fetch(`${COINGECKO_API}/coins/${PSG_TOKEN_ID}/market_chart?vs_currency=usd&days=max&interval=daily`);
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

            createPriceChart();
            document.getElementById('loadingIndicator').style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching historical data:', error);
        document.getElementById('loadingIndicator').innerHTML = '<p style="color: #ef4444;">Error loading data. Please try again later.</p>';
    }
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
                    content: event.label,
                    enabled: true,
                    position: 'top',
                    backgroundColor: event.color,
                    color: '#1f2937',
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    padding: 4,
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

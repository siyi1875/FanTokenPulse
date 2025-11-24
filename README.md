# ⚽ PSG Fan Token Pulse

An interactive dashboard showing the correlation between Paris Saint-Germain (PSG) Fan Token ($PSG) price movements and key team events from November 2020 to November 2025.

![PSG Fan Token Dashboard](https://img.shields.io/badge/Status-Live-success)
![CoinGecko API](https://img.shields.io/badge/Data-CoinGecko%20API-blue)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-ff6384)

## 🎯 Features

- **Real-time Price Data**: Live $PSG token price, market cap, and 24h volume from CoinGecko API
- **Interactive Price Chart**: Historical price data from November 2020 with multiple time range options (1M, 3M, 6M, 1Y, All Time)
- **Event Markers**: Visual indicators on the chart for major PSG team events and token milestones
- **Comprehensive Timeline**: Detailed timeline of key events including:
  - Exchange listings (Binance, Upbit, Paribu)
  - Major player signings (Messi, Neymar, Mbappé era)
  - Player departures and transfers
  - Team achievements and milestones
- **Responsive Design**: Fully responsive layout optimized for desktop, tablet, and mobile devices
- **Auto-refresh**: Automatic data updates every 5 minutes

## 📊 Key Events Tracked

### Token Milestones
- **Dec 21, 2020**: Triple exchange listing (Binance, Paribu, Upbit) - 198% price surge
- **April 2021**: All-Time High of $58.79

### Team Events (2020-2024)
- **Aug 23, 2020**: Champions League Final loss to Bayern Munich
- **Aug 2021**: Historic summer signings (Messi, Ramos, Hakimi, Donnarumma, Wijnaldum)
- **Jun 2023**: Lionel Messi departs to Inter Miami
- **Aug 15, 2023**: Neymar transfers to Al Hilal
- **May 10, 2024**: Mbappé announces Real Madrid move
- **Jun 3, 2024**: Mbappé officially joins Real Madrid
- **Aug 2024**: New era signings (João Neves €70M, Désiré Doué €50M, William Pacho €40M)

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for API data fetching

### Installation

1. Clone the repository:
```bash
git clone https://github.com/siyi1875/FanTokenPulse.git
cd FanTokenPulse
```

2. Open `index.html` in your web browser:
```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

Or use a local development server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js http-server
npx http-server
```

Then navigate to `http://localhost:8000` in your browser.

## 📁 Project Structure

```
FanTokenPulse/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling with PSG colors
├── script.js           # JavaScript with API integration and charting
├── README.md           # Project documentation
└── .gitignore         # Git ignore rules
```

## 🔧 Technologies Used

- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Async/await, fetch API, event handling
- **Chart.js v4**: Interactive and responsive charts
- **CoinGecko API**: Real-time and historical cryptocurrency data
- **Chart.js Plugins**:
  - chartjs-adapter-date-fns: Time scale support
  - chartjs-plugin-annotation: Event markers on charts

## 📡 Data Sources

- **Price Data**: [CoinGecko API](https://www.coingecko.com/en/coins/paris-saint-germain-fan-token) - Free tier with 30 calls/min
- **Team Events**: Compiled from Transfermarkt, Goal.com, ESPN, and official PSG sources
- **Exchange Listings**: Binance, Upbit announcements and trading data

## 🎨 Design Features

- **PSG Brand Colors**: Official PSG blue (#004170) and red (#da0037)
- **Dark Theme**: Easy on the eyes with modern dark mode UI
- **Responsive Grid**: Adapts to all screen sizes
- **Smooth Animations**: Hover effects and transitions
- **Event Color Coding**:
  - 🟢 Green: Exchange listings and positive milestones
  - 🔵 Blue: Player signings
  - 🔴 Red: Player departures
  - 🟡 Yellow: Token milestones (ATH)

## 🔄 Auto-Update Functionality

The dashboard automatically refreshes:
- Current price stats: Every 5 minutes
- Chart data: Can be manually refreshed by selecting time ranges
- Last updated timestamp: Displayed at the bottom

## 🌐 Live Demo

To deploy this dashboard:

### GitHub Pages
1. Push to GitHub
2. Go to repository Settings > Pages
3. Select branch and root folder
4. Access at: `https://yourusername.github.io/FanTokenPulse/`

### Netlify/Vercel
1. Connect your GitHub repository
2. Deploy with default settings (no build step needed)

## 📈 API Usage

This project uses the CoinGecko free API tier:
- **Rate Limit**: 30 calls/minute
- **Monthly Limit**: 10,000 calls
- **No API key required** for basic usage

For higher limits, consider [CoinGecko's paid plans](https://www.coingecko.com/en/api/pricing).

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Ideas for Contributions
- Add more PSG events and milestones
- Implement comparison with other fan tokens (JUV, BAR, etc.)
- Add correlation analysis with social media sentiment
- Create downloadable reports/charts
- Add internationalization (i18n) support

## 📝 License

This project is open source and available under the MIT License.

## ⚠️ Disclaimer

This dashboard is for informational and educational purposes only. It is not financial advice. Always do your own research before making investment decisions.

## 📚 References

- [CoinGecko API Documentation](https://www.coingecko.com/en/api/documentation)
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [PSG Official Website](https://en.psg.fr/)
- [Socios.com Fan Tokens](https://www.socios.com/)

## 🙏 Acknowledgments

- Built with inspiration from [MacroMarket Pulse](https://siyi1875.github.io/MacroMarket-Pulse/)
- Data provided by CoinGecko API
- Team event data compiled from multiple sports sources
- PSG fans worldwide for their passion and support

## 📞 Contact

For questions or suggestions, please open an issue on GitHub.

---

**Built with ❤️ for PSG fans** | [View Live Demo](#) | [Report Bug](../../issues) | [Request Feature](../../issues)
